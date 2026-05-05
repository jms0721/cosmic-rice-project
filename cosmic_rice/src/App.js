import React, { useState } from 'react';
import './App.css';
ffs
function App() {
  const [modalType, setModalType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 사용자 정보 상태
  const [userInfo, setUserInfo] = useState({
    nickname: '코딩하는우럭',
    point: 1500,
    profileImg: '👤'
  });

  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState(userInfo.nickname);

  // 더미 데이터
  const restaurantList = new Array(20).fill('식당이름');
  const communityList = new Array(20).fill('커뮤니티 글제목');
  const myPostList = new Array(15).fill('내가 작성한 게시물 제목입니다.');

  // 모달 제어 함수
  const openModal = (type, item = null) => {
    if (type === 'myPage' && !isLoggedIn) {
      setModalType('auth');
    } else {
      setModalType(type);
    }
    setSelectedItem(item);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedItem(null);
    setIsEditingNickname(false);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setModalType('myPage');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setModalType(null);
  };

  const saveNickname = () => {
    if (tempNickname.trim() !== "") {
      setUserInfo({ ...userInfo, nickname: tempNickname });
    }
    setIsEditingNickname(false);
  };

  return (
    <div className="main-container">
      <div className="layout-wrapper">
        {/* 왼쪽: 식당 목록 */}
        <aside className="left-panel">
          <h2 className="panel-title">식당 목록</h2>
          <div className="scroll-content">
            {restaurantList.map((item, i) => (
              <p key={i} className="clickable" onClick={() => openModal('restaurantDetail', `${item} ${i+1}`)}>
                {item} {i+1}
              </p>
            ))}
          </div>
        </aside>

        {/* 가운데: 지도 */}
        <main className="map-area">
          <input type="text" className="map-search" placeholder="지역 검색" />
          <div className="map-placeholder">지도 영역</div>
        </main>

        {/* 오른쪽: 커뮤니티 */}
        <aside className="right-panel">
          <header className="right-header">
            <button className="nav-btn" onClick={() => openModal('myPage')}>마이페이지</button>
          </header>
          <div className="community-header">
            <h2 className="panel-title-no-border">커뮤니티</h2>
            <input type="text" className="community-search" placeholder="글 제목 검색" />
          </div>
          <div className="scroll-content">
            {communityList.map((item, i) => (
              <p key={i} className="clickable" onClick={() => openModal('communityDetail', `${item} ${i+1}`)}>
                {item} {i+1}
              </p>
            ))}
          </div>
          <button className="fab-button" onClick={() => openModal('writePost')}>+</button>
        </aside>
      </div>

      {/* 모달 시스템 */}
      {modalType && (
        <div className="modal-overlay" onClick={closeModal}>
          <div 
            className={`modal-content 
              ${(modalType === 'myPage' || modalType === 'pointStore' || modalType === 'communityDetail') ? 'large-modal' : ''} 
              ${modalType === 'auth' ? 'auth-modal' : ''}`} 
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-header">
              <div className="header-left">
                {modalType === 'myPage' ? (
                  <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
                ) : (
                  <button className="close-btn" onClick={modalType === 'pointStore' ? () => setModalType('myPage') : closeModal}>
                    &lt; {modalType === 'pointStore' ? '되돌아가기' : '뒤로 가기'}
                  </button>
                )}
              </div>
              
              <span className="modal-title">
                {modalType === 'auth' && '로그인'}
                {modalType === 'myPage' && '마이페이지'}
                {modalType === 'pointStore' && '포인트 상점'}
                {modalType === 'writePost' && '게시물 작성'}
                {modalType === 'restaurantDetail' && '식당 정보'}
                {modalType === 'communityDetail' && '커뮤니티 상세'}
              </span>

              <div className="header-right">
                {modalType === 'myPage' && (
                  <button className="point-store-nav-btn" onClick={() => setModalType('pointStore')}>
                    포인트 상점
                  </button>
                )}
              </div>
            </header>
            
            <div className="modal-body">
              {/* 1. 로그인 화면 */}
              {modalType === 'auth' && (
                <div className="auth-form">
                  <div className="auth-logo" style={{textAlign:'center', fontSize:'24px', fontWeight:'bold', marginBottom:'20px'}}>LOGIN</div>
                  <input type="text" placeholder="아이디" />
                  <input type="password" placeholder="비밀번호" />
                  <button className="auth-submit-btn" onClick={handleLogin}>로그인 / 회원가입</button>
                </div>
              )}

              {/* 2. 마이페이지 */}
              {modalType === 'myPage' && (
                <div className="mypage-full-container" style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
                  <div className="mypage-top-section">
                    <div className="profile-circle-large">{userInfo.profileImg}</div>
                    <div className="nickname-container">
                      <div className="nickname-box-fixed">
                        {isEditingNickname ? (
                          <input 
                            value={tempNickname} 
                            onChange={(e) => setTempNickname(e.target.value)}
                            onBlur={saveNickname}
                            onKeyDown={(e) => e.key === 'Enter' && saveNickname()}
                            autoFocus
                            className="nickname-edit-input"
                          />
                        ) : (
                          <span>{userInfo.nickname}</span>
                        )}
                      </div>
                      <span className="edit-pencil-icon" onClick={() => setIsEditingNickname(true)}>✎</span>
                    </div>
                  </div>
                  <div className="mypage-posts-section">
                    <div className="section-label">내 게시물</div>
                    <div className="mypage-posts-scroll">
                      {myPostList.map((post, i) => (
                        <div key={i} className="my-post-item">{post} {i+1}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. 포인트 상점 (최종 업데이트 버전) */}
              {modalType === 'pointStore' && (
                <div className="ps-full-wrapper">
                  <div className="ps-top-profile-section">
                    <div className="ps-top-left-content">
                      <div className="ps-main-photo">{userInfo.profileImg}</div>
                      <div className="ps-main-nickname">닉네임: {userInfo.nickname}님</div>
                    </div>
                    <div className="ps-main-point-box">{userInfo.point.toLocaleString()} P</div>
                  </div>

                  <div className="ps-bottom-scroll-section">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="ps-list-row-item">
                        <div className="ps-item-left-group">
                          <div className="ps-sub-photo">이미지</div>
                          <div className="ps-sub-box">카테고리</div>
                          <div className="ps-sub-box">아이템명</div>
                          <div className="ps-sub-price-white">300 P</div>
                        </div>
                        <button 
                          className="ps-buy-action-btn"
                          onClick={() => {
                            if (window.confirm("구매하시겠습니까?")) alert("구매 완료!");
                          }}
                        >
                          구매
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. 식당 상세 */}
              {modalType === 'restaurantDetail' && (
                <div className="centered-content" style={{flexDirection:'column'}}>
                  <h3>{selectedItem}</h3>
                  <p style={{marginTop:'10px'}}>상세 정보입니다.</p>
                </div>
              )}

              {/* 5. 커뮤니티 상세 */}
              {modalType === 'communityDetail' && (
                <div className="community-detail-layout">
                  <div className="post-main-content">
                    <div className="post-header-area">
                      <h2>{selectedItem}</h2>
                      <p className="post-meta">작성자: User123 | 2026-04-14</p>
                    </div>
                    <hr style={{margin: '15px 0'}} />
                    <div className="post-body-text">
                      <p>작성된 글의 본문 내용이 상단에 위치합니다.</p>
                      <p>(선택된 항목: {selectedItem})</p>
                      <div className="post-img-box">이미지 영역</div>
                    </div>
                  </div>

                  <aside className="post-sidebar">
                    <div className="sidebar-comment-container">
                      <div className="comment-label">댓글 3개</div>
                      <div className="comment-scroll-list">
                        <div className="comment-bubble"><b>길동:</b> 정보 감사합니다!</div>
                        <div className="comment-bubble"><b>철수:</b> 오 가보고 싶네요.</div>
                        <div className="comment-bubble"><b>영희:</b> 위치가 어디죠?</div>
                      </div>
                      <div className="sidebar-comment-input-box">
                        <textarea placeholder="댓글을 입력하세요..."></textarea>
                        <button className="comment-post-btn">등록하기</button>
                      </div>
                      <div className="sidebar-bottom-actions">
                        <button className="action-btn-item like">❤️ 좋아요 15</button>
                        <button className="action-btn-item share">🔗 공유하기</button>
                      </div>
                    </div>
                  </aside>
                </div>
              )}

              {/* 6. 게시물 작성 */}
              {modalType === 'writePost' && (
                <div className="write-form">
                  <input type="text" placeholder="제목" />
                  <textarea rows="10" placeholder="내용"></textarea>
                  <button className="submit-btn" onClick={closeModal}>등록</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;