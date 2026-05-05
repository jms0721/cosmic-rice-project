import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const KAKAO_JAVASCRIPT_KEY = process.env.REACT_APP_KAKAO_MAP_API_KEY;
const KAKAO_LOCAL_REST_API_KEY = '68981317ed8a2b9ebbd6b31d3272644a';
const KAKAO_AUTH_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/v1/kakao.min.js';

const SEOUL_CITY_HALL = {
  lat: 37.566826,
  lng: 126.9786567,
};

const STORAGE_KEYS = {
  users: 'cosmicRiceUsers',
  currentUserId: 'cosmicRiceCurrentUserId',
  posts: 'cosmicRicePosts',
};

const DEFAULT_USER_PROFILE = {
  point: 1500,
  profileImg: 'CR',
  profileImageUrl: '',
  bio: '오늘의 식당 기록을 모으는 중입니다.',
};

const readStorage = (key, fallback) => {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

const waitForKakaoMapSdk = () => {
  if (window.kakao?.maps) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let checkCount = 0;

    const checkKakaoMapSdk = () => {
      if (window.kakao?.maps) {
        resolve();
        return;
      }

      checkCount += 1;

      if (checkCount > 100) {
        reject(new Error('Kakao map SDK was not loaded.'));
        return;
      }

      window.setTimeout(checkKakaoMapSdk, 100);
    };

    checkKakaoMapSdk();
  });
};

const waitForKakaoAuthSdk = () => {
  if (window.Kakao?.Auth && window.Kakao?.API) {
    return Promise.resolve(window.Kakao);
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${KAKAO_AUTH_SDK_URL}"]`);

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = KAKAO_AUTH_SDK_URL;
      script.async = true;
      script.onload = () => {
        if (window.Kakao?.Auth && window.Kakao?.API) {
          resolve(window.Kakao);
        }
      };
      script.onerror = () => reject(new Error('Kakao login SDK script failed to load.'));
      document.head.appendChild(script);
    }

    let checkCount = 0;

    const checkKakaoAuthSdk = () => {
      if (window.Kakao?.Auth && window.Kakao?.API) {
        resolve(window.Kakao);
        return;
      }

      checkCount += 1;

      if (checkCount > 100) {
        reject(new Error('Kakao login SDK was not loaded.'));
        return;
      }

      window.setTimeout(checkKakaoAuthSdk, 100);
    };

    checkKakaoAuthSdk();
  });
};

const initializeKakaoAuthSdk = (Kakao) => {
  if (!KAKAO_JAVASCRIPT_KEY) {
    throw new Error('Kakao JavaScript key is missing.');
  }

  if (!Kakao.isInitialized()) {
    Kakao.init(KAKAO_JAVASCRIPT_KEY);
  }

  return Kakao;
};

const getInitials = (name) => {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 2).toUpperCase() : 'CR';
};

const RESTAURANT_IMAGE_URL =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=720&q=80';

const normalizePlace = (place) => ({
  id: place.id || `${place.place_name}-${place.x}-${place.y}`,
  place_name: place.place_name || '이름 없는 식당',
  category_name: place.category_name || '식당',
  address_name: place.road_address_name || place.address_name || '주소 정보 없음',
  phone: place.phone || '',
  place_url: place.place_url || '',
  image_url: RESTAURANT_IMAGE_URL,
  x: place.x,
  y: place.y,
});

const CATEGORY_OPTIONS = [
  { value: 'FD6', label: '음식점' },
  { value: 'CE7', label: '카페' },
  { value: 'MT1', label: '대형마트' },
  { value: 'CS2', label: '편의점' },
  { value: 'PK6', label: '주차장' },
];

const SELECTED_PLACE_MARKER =
  'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2228%22%20height%3D%2236%22%20viewBox%3D%220%200%2028%2036%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M14%2035C14%2035%2025%2023.2%2025%2012.8C25%206.28%2020.08%201%2014%201C7.92%201%203%206.28%203%2012.8C3%2023.2%2014%2035%2014%2035Z%22%20fill%3D%22%231F6FEB%22%20stroke%3D%22white%22%20stroke-width%3D%222%22/%3E%3Ccircle%20cx%3D%2214%22%20cy%3D%2212.8%22%20r%3D%225%22%20fill%3D%22white%22/%3E%3C/svg%3E';

const mergeUniquePlaces = (...placeGroups) => {
  const placeMap = new Map();

  placeGroups.flat().forEach((place) => {
    if (place?.id) {
      placeMap.set(place.id, place);
    }
  });

  return Array.from(placeMap.values());
};

const searchKakaoPlaces = async ({ mode, query, categoryCode, center, maxPages = 1 }) => {
  const endpoint =
    mode === 'keyword'
      ? 'https://dapi.kakao.com/v2/local/search/keyword.json'
      : 'https://dapi.kakao.com/v2/local/search/category.json';
  const searchedPlaces = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const params = new URLSearchParams({
      x: String(center.lng),
      y: String(center.lat),
      radius: '20000',
      sort: 'distance',
      size: '15',
      page: String(page),
    });

    if (mode === 'keyword') {
      params.set('query', query);
    } else {
      params.set('category_group_code', categoryCode);
    }

    const response = await fetch(`${endpoint}?${params.toString()}`, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_LOCAL_REST_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Kakao place search failed.');
    }

    const data = await response.json();
    searchedPlaces.push(...(data.documents || []).map(normalizePlace));

    if (data.meta?.is_end) {
      break;
    }
  }

  return searchedPlaces;
};

function KakaoMap({ selectedRestaurant, clickablePlaces, onCenterChange, onRestaurantSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const clickOverlayRefs = useRef([]);
  const selectedMarkerRef = useRef(null);
  const [mapStatus, setMapStatus] = useState('loading');

  const clearClickOverlays = useCallback(() => {
    clickOverlayRefs.current.forEach((overlay) => overlay.setMap(null));
    clickOverlayRefs.current = [];
  }, []);

  useEffect(() => {
    let isMounted = true;
    const mapContainerElement = mapRef.current;

    const initializeMap = () => {
      if (!isMounted) {
        return;
      }

      const mapContainer = mapRef.current;

      if (!window.kakao?.maps || !mapContainer) {
        setMapStatus('error');
        return;
      }

      mapContainer.replaceChildren();

      const center = new window.kakao.maps.LatLng(SEOUL_CITY_HALL.lat, SEOUL_CITY_HALL.lng);
      const map = new window.kakao.maps.Map(mapContainer, {
        center,
        level: 4,
      });

      mapInstanceRef.current = map;
      setMapStatus('ready');
      onCenterChange(SEOUL_CITY_HALL);
      window.kakao.maps.event.addListener(map, 'idle', () => {
        const nextCenter = map.getCenter();
        onCenterChange({
          lat: nextCenter.getLat(),
          lng: nextCenter.getLng(),
        });
      });
    };

    waitForKakaoMapSdk()
      .then(initializeMap)
      .catch(() => {
        if (isMounted) {
          setMapStatus('error');
        }
      });

    return () => {
      isMounted = false;
      clearClickOverlays();
      selectedMarkerRef.current?.setMap(null);
      selectedMarkerRef.current = null;
      mapInstanceRef.current = null;
      mapContainerElement?.replaceChildren();
    };
  }, [clearClickOverlays, onCenterChange]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.kakao?.maps) {
      return;
    }

    clearClickOverlays();

    clickablePlaces.forEach((place) => {
      if (!place.x || !place.y) {
        return;
      }

      const overlayElement = document.createElement('button');
      overlayElement.type = 'button';
      overlayElement.className = 'map-place-click-zone';
      overlayElement.setAttribute('aria-label', `${place.place_name} 선택`);
      overlayElement.addEventListener('click', () => onRestaurantSelect(place));

      const overlay = new window.kakao.maps.CustomOverlay({
        content: overlayElement,
        position: new window.kakao.maps.LatLng(place.y, place.x),
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: 2,
      });

      overlay.setMap(mapInstanceRef.current);
      clickOverlayRefs.current.push(overlay);
    });
  }, [clearClickOverlays, clickablePlaces, onRestaurantSelect]);

  useEffect(() => {
    if (!selectedRestaurant || !mapInstanceRef.current || !window.kakao?.maps) {
      selectedMarkerRef.current?.setMap(null);
      selectedMarkerRef.current = null;
      return;
    }

    const position = new window.kakao.maps.LatLng(selectedRestaurant.y, selectedRestaurant.x);
    const markerImage = new window.kakao.maps.MarkerImage(
      SELECTED_PLACE_MARKER,
      new window.kakao.maps.Size(28, 36),
      { offset: new window.kakao.maps.Point(14, 36) }
    );

    selectedMarkerRef.current?.setMap(null);
    selectedMarkerRef.current = new window.kakao.maps.Marker({
      map: mapInstanceRef.current,
      position,
      image: markerImage,
    });

    mapInstanceRef.current.panTo(position);
  }, [selectedRestaurant]);

  return (
    <main className="map-area">
      <div ref={mapRef} className="map-canvas" aria-label="카카오 지도" />
      {mapStatus !== 'ready' && (
        <div className="map-message">
          {mapStatus === 'loading' && '지도를 불러오는 중입니다.'}
          {mapStatus === 'no-result' && '검색 결과가 없습니다.'}
          {mapStatus === 'error' && '지도를 불러오지 못했습니다. API 키와 도메인 설정을 확인해 주세요.'}
        </div>
      )}
    </main>
  );
}

function App() {
  const [modalType, setModalType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [isKakaoReady, setIsKakaoReady] = useState(false);
  const [users, setUsers] = useState(() => readStorage(STORAGE_KEYS.users, []));
  const [currentUserId, setCurrentUserId] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEYS.currentUserId) || '';
    } catch {
      return '';
    }
  });
  const [posts, setPosts] = useState(() =>
    readStorage(STORAGE_KEYS.posts, [
      {
        id: 'sample-1',
        title: '시청 근처 점심 추천',
        content: '오늘은 지도에서 찾은 식당 후보를 정리해봤어요.',
        authorId: 'sample',
        authorNickname: '운영자',
        createdAt: '2026-04-30',
      },
      {
        id: 'sample-2',
        title: '가성비 좋은 한식집 모음',
        content: '직장인 점심으로 갈 만한 곳들을 댓글로 같이 모아봐요.',
        authorId: 'sample',
        authorNickname: '운영자',
        createdAt: '2026-04-30',
      },
    ])
  );
  const [profileDraft, setProfileDraft] = useState({ nickname: '', bio: '' });
  const [postDraft, setPostDraft] = useState({ title: '', content: '' });
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [placeResults, setPlaceResults] = useState([]);
  const [mapClickablePlaces, setMapClickablePlaces] = useState([]);
  const [placeSearchMode, setPlaceSearchMode] = useState('keyword');
  const [placeKeyword, setPlaceKeyword] = useState('');
  const [placeCategory, setPlaceCategory] = useState('FD6');
  const [placeSearchStatus, setPlaceSearchStatus] = useState('idle');
  const [mapCenter, setMapCenter] = useState(SEOUL_CITY_HALL);

  const currentUser = useMemo(
    () => users.find((user) => user.id === currentUserId) || null,
    [users, currentUserId]
  );
  const isLoggedIn = Boolean(currentUser);

  const communityList = posts;
  const myPostList = posts.filter((post) => post.authorId === currentUserId);
  const mapClickPlaces = useMemo(
    () => mergeUniquePlaces(mapClickablePlaces, placeResults),
    [mapClickablePlaces, placeResults]
  );

  const handleRestaurantSelect = useCallback((restaurant) => {
    setSelectedRestaurant(restaurant);
  }, []);

  const handlePlaceSearch = async (event) => {
    event.preventDefault();

    if (placeSearchMode === 'keyword' && !placeKeyword.trim()) {
      setPlaceSearchStatus('idle');
      return;
    }

    setPlaceSearchStatus('loading');

    try {
      const results = await searchKakaoPlaces({
        mode: placeSearchMode,
        query: placeKeyword.trim(),
        categoryCode: placeCategory,
        center: mapCenter,
        maxPages: placeSearchMode === 'category' ? 3 : 1,
      });

      setPlaceResults(results);
      setSelectedRestaurant(null);
      setPlaceSearchStatus(results.length ? 'ready' : 'empty');
    } catch {
      setPlaceResults([]);
      setPlaceSearchStatus('error');
    }
  };

  useEffect(() => {
    let isMounted = true;
    const searchTimer = window.setTimeout(() => {
      searchKakaoPlaces({
        mode: 'category',
        query: '',
        categoryCode: 'FD6',
        center: mapCenter,
        maxPages: 3,
      })
        .then((results) => {
          if (!isMounted) {
            return;
          }

          setMapClickablePlaces(results);
        })
        .catch(() => {
          if (isMounted) {
            setMapClickablePlaces([]);
          }
        });
    }, 350);

    return () => {
      isMounted = false;
      window.clearTimeout(searchTimer);
    };
  }, [mapCenter]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.users, users);
  }, [users]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.posts, posts);
  }, [posts]);

  useEffect(() => {
    if (currentUserId) {
      window.localStorage.setItem(STORAGE_KEYS.currentUserId, currentUserId);
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.currentUserId);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUser) {
      setProfileDraft({
        nickname: currentUser.nickname,
        bio: currentUser.bio || '',
      });
    }
  }, [currentUser]);

  useEffect(() => {
    waitForKakaoAuthSdk()
      .then((Kakao) => {
        initializeKakaoAuthSdk(Kakao);
        setIsKakaoReady(true);
      })
      .catch(() => {
        setIsKakaoReady(false);
      });
  }, []);

  const openModal = (type, item = null) => {
    if ((type === 'myPage' || type === 'writePost') && !isLoggedIn) {
      setAuthMode('login');
      setAuthError('로그인이 필요한 기능입니다.');
      setModalType('auth');
      return;
    }

    setSelectedItem(item);
    setModalType(type);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedItem(null);
    setAuthError('');
    setPostDraft({ title: '', content: '' });
  };

  const completeKakaoLogin = (kakaoProfile) => {
    const kakaoAccount = kakaoProfile.kakao_account || {};
    const profile = kakaoAccount.profile || kakaoProfile.properties || {};
    const nickname = profile.nickname || `카카오사용자${kakaoProfile.id}`;
    const profileImageUrl = profile.profile_image_url || profile.thumbnail_image || '';
    const kakaoUserId = `kakao-${kakaoProfile.id}`;
    const email = kakaoAccount.email || `${kakaoUserId}@kakao.local`;

    setUsers((prevUsers) => {
      const existingUser = prevUsers.find((user) => user.id === kakaoUserId || user.email === email);
      const nextUser = {
        ...(existingUser || {}),
        id: existingUser?.id || kakaoUserId,
        provider: 'kakao',
        email,
        password: existingUser?.password || '',
        nickname: existingUser?.nickname || nickname,
        point: existingUser?.point || DEFAULT_USER_PROFILE.point,
        profileImg: existingUser?.profileImg || getInitials(nickname),
        profileImageUrl: profileImageUrl || existingUser?.profileImageUrl || '',
        bio: existingUser?.bio || '카카오로 로그인했습니다.',
        createdAt: existingUser?.createdAt || new Date().toISOString(),
      };

      if (existingUser) {
        return prevUsers.map((user) => (user.id === existingUser.id ? nextUser : user));
      }

      return [...prevUsers, nextUser];
    });

    setCurrentUserId(kakaoUserId);
    setAuthError('');
    setModalType('myPage');
  };

  const handleKakaoLogin = () => {
    if (!KAKAO_JAVASCRIPT_KEY) {
      setAuthError('Kakao JavaScript 키가 .env에 없습니다.');
      return;
    }

    if (!window.Kakao?.Auth || !window.Kakao?.API) {
      setAuthError('카카오 로그인 SDK를 아직 불러오는 중입니다. 잠시 후 다시 눌러 주세요.');
      waitForKakaoAuthSdk()
        .then((Kakao) => {
          initializeKakaoAuthSdk(Kakao);
          setIsKakaoReady(true);
        })
        .catch(() => setAuthError('카카오 로그인 SDK를 불러오지 못했습니다.'));
      return;
    }

    const Kakao = initializeKakaoAuthSdk(window.Kakao);

    Kakao.Auth.login({
      success: () => {
        Kakao.API.request({
          url: '/v2/user/me',
          success: completeKakaoLogin,
          fail: () => setAuthError('카카오 사용자 정보를 가져오지 못했습니다. 동의항목 설정을 확인해 주세요.'),
        });
      },
      fail: () => setAuthError('카카오 로그인이 취소되었거나 실패했습니다.'),
    });
  };

  const handleLogin = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email')).trim().toLowerCase();
    const password = String(form.get('password'));
    const user = users.find((item) => item.email === email && item.password === password);

    if (!user) {
      setAuthError('이메일 또는 비밀번호가 맞지 않습니다.');
      return;
    }

    setCurrentUserId(user.id);
    setAuthError('');
    setModalType('myPage');
  };

  const handleSignup = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nickname = String(form.get('nickname')).trim();
    const email = String(form.get('email')).trim().toLowerCase();
    const password = String(form.get('password'));
    const passwordConfirm = String(form.get('passwordConfirm'));

    if (!nickname || !email || !password) {
      setAuthError('닉네임, 이메일, 비밀번호를 모두 입력해 주세요.');
      return;
    }

    if (password.length < 4) {
      setAuthError('비밀번호는 4자 이상 입력해 주세요.');
      return;
    }

    if (password !== passwordConfirm) {
      setAuthError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    if (users.some((user) => user.email === email)) {
      setAuthError('이미 가입된 이메일입니다.');
      return;
    }

    const newUser = {
      id: `user-${Date.now()}`,
      provider: 'local',
      email,
      password,
      nickname,
      ...DEFAULT_USER_PROFILE,
      createdAt: new Date().toISOString(),
    };

    setUsers((prevUsers) => [...prevUsers, newUser]);
    setCurrentUserId(newUser.id);
    setAuthError('');
    setModalType('myPage');
  };

  const handleLogout = () => {
    if (window.Kakao?.Auth?.getAccessToken?.()) {
      window.Kakao.Auth.logout(() => {});
    }

    setCurrentUserId('');
    setModalType(null);
  };

  const saveProfile = () => {
    if (!currentUser) return;

    const nickname = profileDraft.nickname.trim();
    if (!nickname) {
      setProfileDraft((prevDraft) => ({ ...prevDraft, nickname: currentUser.nickname }));
      return;
    }

    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === currentUser.id
          ? {
              ...user,
              nickname,
              bio: profileDraft.bio.trim(),
              profileImg: user.profileImg || getInitials(nickname),
            }
          : user
      )
    );
  };

  const submitPost = (event) => {
    event.preventDefault();
    if (!currentUser) return;

    const title = postDraft.title.trim();
    const content = postDraft.content.trim();

    if (!title || !content) {
      return;
    }

    const createdAt = new Intl.DateTimeFormat('ko-KR').format(new Date());
    const nextPost = {
      id: `post-${Date.now()}`,
      title,
      content,
      authorId: currentUser.id,
      authorNickname: currentUser.nickname,
      createdAt,
    };

    setPosts((prevPosts) => [nextPost, ...prevPosts]);
    setSelectedItem(nextPost);
    setPostDraft({ title: '', content: '' });
    setModalType('communityDetail');
  };

  const modalTitle = {
    auth: authMode === 'login' ? '로그인' : '회원가입',
    myPage: '마이페이지',
    pointStore: '포인트 상점',
    writePost: '게시글 작성',
    restaurantDetail: '식당 정보',
    communityDetail: '커뮤니티 상세',
  }[modalType];

  return (
    <div className="main-container">
      <div className="layout-wrapper">
        <aside className="left-panel">
          <h2 className="panel-title">장소 검색</h2>
          <div className="scroll-content">
            <form className="place-search-panel" onSubmit={handlePlaceSearch}>
              <div className="search-mode-tabs" role="tablist" aria-label="검색 방식">
                <button
                  className={placeSearchMode === 'keyword' ? 'active' : ''}
                  type="button"
                  onClick={() => setPlaceSearchMode('keyword')}
                >
                  키워드
                </button>
                <button
                  className={placeSearchMode === 'category' ? 'active' : ''}
                  type="button"
                  onClick={() => setPlaceSearchMode('category')}
                >
                  카테고리
                </button>
              </div>

              {placeSearchMode === 'keyword' ? (
                <input
                  type="search"
                  value={placeKeyword}
                  onChange={(event) => setPlaceKeyword(event.target.value)}
                  placeholder="예: 강남역 맛집"
                  aria-label="키워드 검색어"
                />
              ) : (
                <select value={placeCategory} onChange={(event) => setPlaceCategory(event.target.value)}>
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              )}

              <button type="submit" disabled={placeSearchStatus === 'loading'}>
                {placeSearchStatus === 'loading' ? '검색 중' : '검색'}
              </button>
            </form>

            {placeSearchStatus === 'error' && (
              <div className="restaurant-empty-state">
                <strong>검색에 실패했습니다.</strong>
                <p>API 키와 네트워크 상태를 확인해 주세요.</p>
              </div>
            )}

            {placeSearchStatus === 'empty' && (
              <div className="restaurant-empty-state">
                <strong>검색 결과가 없습니다.</strong>
                <p>다른 키워드나 카테고리로 다시 검색해 보세요.</p>
              </div>
            )}

            {placeResults.length > 0 && (
              <div className="place-result-list">
                {placeResults.map((place) => (
                  <button
                    key={place.id}
                    className={`place-result-button ${selectedRestaurant?.id === place.id ? 'active' : ''}`}
                    type="button"
                    onClick={() => handleRestaurantSelect(place)}
                  >
                    <strong>{place.place_name}</strong>
                    <span>{place.category_name}</span>
                    <small>{place.address_name}</small>
                  </button>
                ))}
              </div>
            )}

            {selectedRestaurant ? (
              <article className="restaurant-detail-card">
                <img src={selectedRestaurant.image_url} alt={`${selectedRestaurant.place_name} 대표 이미지`} />
                <div className="restaurant-detail-body">
                  <strong>{selectedRestaurant.place_name}</strong>
                  <span>{selectedRestaurant.category_name}</span>
                  <p>{selectedRestaurant.address_name}</p>
                  {selectedRestaurant.phone && <p className="restaurant-phone-line">{selectedRestaurant.phone}</p>}
                  <div className="restaurant-detail-actions">
                    <button type="button" onClick={() => openModal('restaurantDetail', selectedRestaurant)}>
                      자세히
                    </button>
                    {selectedRestaurant.place_url && (
                      <a href={selectedRestaurant.place_url} target="_blank" rel="noreferrer">
                        카카오맵
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ) : (
              <div className="restaurant-empty-state">
                <strong>검색 결과를 클릭해 보세요.</strong>
                <p>선택한 장소의 사진과 정보가 여기에 표시됩니다.</p>
              </div>
            )}
          </div>
        </aside>

        <KakaoMap
          selectedRestaurant={selectedRestaurant}
          clickablePlaces={mapClickPlaces}
          onCenterChange={setMapCenter}
          onRestaurantSelect={handleRestaurantSelect}
        />

        <aside className="right-panel">
          <header className="right-header">
            <button className="nav-btn" type="button" onClick={() => openModal('myPage')}>
              {isLoggedIn ? `${currentUser.nickname}님` : '로그인'}
            </button>
          </header>
          <div className="community-header">
            <h2 className="panel-title-no-border">커뮤니티</h2>
            <input type="text" className="community-search" placeholder="글 제목 검색" />
          </div>
          <div className="scroll-content">
            {communityList.map((post) => (
              <button
                key={post.id}
                className="list-button"
                type="button"
                onClick={() => openModal('communityDetail', post)}
              >
                <span>{post.title}</span>
                <small>{post.authorNickname}</small>
              </button>
            ))}
          </div>
          <button className="fab-button" type="button" onClick={() => openModal('writePost')}>
            +
          </button>
        </aside>
      </div>

      {modalType && (
        <div className="modal-overlay" onClick={closeModal}>
          <section
            className={`modal-content ${
              modalType === 'myPage' || modalType === 'pointStore' || modalType === 'communityDetail' ? 'large-modal' : ''
            } ${modalType === 'auth' ? 'auth-modal' : ''}`}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <div className="header-left">
                {modalType === 'myPage' ? (
                  <button className="logout-btn" type="button" onClick={handleLogout}>
                    로그아웃
                  </button>
                ) : (
                  <button
                    className="close-btn"
                    type="button"
                    onClick={modalType === 'pointStore' ? () => setModalType('myPage') : closeModal}
                  >
                    &lt; {modalType === 'pointStore' ? '돌아가기' : '닫기'}
                  </button>
                )}
              </div>

              <span className="modal-title">{modalTitle}</span>

              <div className="header-right">
                {modalType === 'myPage' && (
                  <button className="point-store-nav-btn" type="button" onClick={() => setModalType('pointStore')}>
                    포인트 상점
                  </button>
                )}
              </div>
            </header>

            <div className="modal-body">
              {modalType === 'auth' && (
                <div className="auth-panel">
                  <div className="auth-tabs" role="tablist" aria-label="인증 방식">
                    <button
                      className={authMode === 'login' ? 'active' : ''}
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setAuthError('');
                      }}
                    >
                      로그인
                    </button>
                    <button
                      className={authMode === 'signup' ? 'active' : ''}
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setAuthError('');
                      }}
                    >
                      회원가입
                    </button>
                  </div>

                  {authError && <p className="form-error">{authError}</p>}

                  <button
                    className="kakao-login-btn"
                    type="button"
                    onClick={handleKakaoLogin}
                    disabled={!isKakaoReady}
                  >
                    {isKakaoReady ? '카카오로 계속하기' : '카카오 로그인 준비 중'}
                  </button>

                  <div className="auth-divider">
                    <span>또는</span>
                  </div>

                  {authMode === 'login' ? (
                    <form className="auth-form" onSubmit={handleLogin}>
                      <label>
                        이메일
                        <input name="email" type="email" autoComplete="email" required />
                      </label>
                      <label>
                        비밀번호
                        <input name="password" type="password" autoComplete="current-password" required />
                      </label>
                      <button className="auth-submit-btn" type="submit">
                        로그인
                      </button>
                    </form>
                  ) : (
                    <form className="auth-form" onSubmit={handleSignup}>
                      <label>
                        닉네임
                        <input name="nickname" type="text" maxLength="16" required />
                      </label>
                      <label>
                        이메일
                        <input name="email" type="email" autoComplete="email" required />
                      </label>
                      <label>
                        비밀번호
                        <input name="password" type="password" autoComplete="new-password" required />
                      </label>
                      <label>
                        비밀번호 확인
                        <input name="passwordConfirm" type="password" autoComplete="new-password" required />
                      </label>
                      <button className="auth-submit-btn" type="submit">
                        가입하고 시작하기
                      </button>
                    </form>
                  )}
                </div>
              )}

              {modalType === 'myPage' && currentUser && (
                <div className="mypage-full-container">
                  <section className="mypage-top-section">
                    <div className="profile-circle-large">
                      {currentUser.profileImageUrl ? (
                        <img src={currentUser.profileImageUrl} alt="" />
                      ) : (
                        currentUser.profileImg
                      )}
                    </div>
                    <div className="profile-fields">
                      <label>
                        닉네임
                        <input
                          value={profileDraft.nickname}
                          onChange={(event) => setProfileDraft({ ...profileDraft, nickname: event.target.value })}
                          onBlur={saveProfile}
                          maxLength="16"
                        />
                      </label>
                      <label>
                        소개
                        <textarea
                          value={profileDraft.bio}
                          onChange={(event) => setProfileDraft({ ...profileDraft, bio: event.target.value })}
                          onBlur={saveProfile}
                          rows="3"
                        />
                      </label>
                    </div>
                    <dl className="profile-stats">
                      <div>
                        <dt>로그인</dt>
                        <dd>{currentUser.provider === 'kakao' ? '카카오' : '이메일'}</dd>
                      </div>
                      <div>
                        <dt>이메일</dt>
                        <dd>{currentUser.email}</dd>
                      </div>
                      <div>
                        <dt>포인트</dt>
                        <dd>{currentUser.point}P</dd>
                      </div>
                      <div>
                        <dt>내 글</dt>
                        <dd>{myPostList.length}개</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="mypage-posts-section">
                    <div className="section-label">내가 쓴 게시글</div>
                    <div className="mypage-posts-scroll">
                      {myPostList.length === 0 ? (
                        <p className="empty-state">아직 작성한 게시글이 없습니다.</p>
                      ) : (
                        myPostList.map((post) => (
                          <button
                            key={post.id}
                            className="my-post-item"
                            type="button"
                            onClick={() => {
                              setSelectedItem(post);
                              setModalType('communityDetail');
                            }}
                          >
                            <span>{post.title}</span>
                            <small>{post.createdAt}</small>
                          </button>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              )}

              {modalType === 'pointStore' && currentUser && (
                <div className="point-store-placeholder">
                  <div className="current-point-display">현재 포인트 {currentUser.point}P</div>
                  <div className="store-items-dummy">
                    <div className="dummy-item">프로필 테마와 배지를 준비 중입니다.</div>
                  </div>
                </div>
              )}

              {modalType === 'restaurantDetail' && (
                <div className="centered-text">
                  <h3>{selectedItem.place_name}</h3>
                  <p>{selectedItem.category_name}</p>
                  <p>{selectedItem.address_name}</p>
                  {selectedItem.phone && <p>{selectedItem.phone}</p>}
                  {selectedItem.place_url && (
                    <a href={selectedItem.place_url} target="_blank" rel="noreferrer">
                      카카오맵에서 자세히 보기
                    </a>
                  )}
                </div>
              )}

              {modalType === 'communityDetail' && selectedItem && (
                <div className="community-detail-layout">
                  <div className="post-main-content">
                    <div className="post-header-area">
                      <h2>{selectedItem.title}</h2>
                      <p className="post-meta">
                        작성자 {selectedItem.authorNickname} | {selectedItem.createdAt}
                      </p>
                    </div>
                    <hr />
                    <div className="post-body-text">
                      <p>{selectedItem.content}</p>
                    </div>
                  </div>

                  <aside className="post-sidebar">
                    <div className="sidebar-comment-container">
                      <div className="comment-label">댓글 3개</div>
                      <div className="comment-scroll-list">
                        <div className="comment-bubble">
                          <b>민지:</b> 다음에 한번 가봐야겠어요.
                        </div>
                        <div className="comment-bubble">
                          <b>준호:</b> 지도 위치도 같이 보면 좋네요.
                        </div>
                        <div className="comment-bubble">
                          <b>서연:</b> 후기 감사합니다.
                        </div>
                      </div>
                      <div className="sidebar-comment-input-box">
                        <textarea placeholder="댓글을 입력하세요" />
                        <button className="comment-post-btn" type="button">
                          등록하기
                        </button>
                      </div>
                      <div className="sidebar-bottom-actions">
                        <button className="action-btn-item like" type="button">
                          좋아요 15
                        </button>
                        <button className="action-btn-item share" type="button">
                          공유하기
                        </button>
                      </div>
                    </div>
                  </aside>
                </div>
              )}

              {modalType === 'writePost' && (
                <form className="write-form" onSubmit={submitPost}>
                  <input
                    type="text"
                    placeholder="제목"
                    value={postDraft.title}
                    onChange={(event) => setPostDraft({ ...postDraft, title: event.target.value })}
                    required
                  />
                  <textarea
                    rows="10"
                    placeholder="내용"
                    value={postDraft.content}
                    onChange={(event) => setPostDraft({ ...postDraft, content: event.target.value })}
                    required
                  />
                  <button className="submit-btn" type="submit">
                    등록
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
