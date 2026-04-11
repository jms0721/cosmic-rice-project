import React, { useState } from 'react';
import './App.css';

function App() {
  const [modalType, setModalType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // 1. 로그인 기능이 필요 없으므로 setUserInfo를 삭제하고 상수로 관리합니다.
  // 이로써 'setUserInfo is assigned a value but never used' 경고가 완전히 해결됩니다.
  const userInfo = {
    nickname: '닉네임',
    point: '내 포인트',
    profileImg: '프로필 사진'
  };

  // 모달 열기
  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
  };

  // 모달 닫기
  const closeModal = () => {
    setModalType(null);
    setSelectedItem(null);
  };

  const restaurantList = new Array(20).fill('식당이름');
  const communityList = new Array(20).fill('커뮤니티 글제목');

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
            <button className="nav-btn" onClick={() => openModal('pointStore')}>포인트 상점</button>
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

      {/* 팝업 모달창 */}
      {modalType && (
        <div className="modal-overlay" onClick={closeModal}>
          <div 
            className={`modal-content ${modalType === 'communityDetail' ? 'large-modal' : ''}`} 
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-header">
              <button className="close-btn" onClick={closeModal}>&lt; 뒤로 가기</button>
              <span className="modal-title">
                {modalType === 'myPage' && '마이페이지'}
                {modalType === 'pointStore' && '포인트 상점'}
                {modalType === 'writePost' && '게시물 작성'}
                {modalType === 'restaurantDetail' && '식당 정보'}
                {modalType === 'communityDetail' && '커뮤니티 상세'}
              </span>
            </header>
            
            <div className="modal-body">
              {/* 이미지 와이어프레임 반영: 마이페이지 */}
              {modalType === 'myPage' && (
                <div className="mypage-modal-container">
                  <div className="mypage-header-profile">
                    {/* 프로필 사진 원형 */}
                    <div className="profile-circle">{userInfo.profileImg}</div>
                    {/* 닉네임 긴 사각형 */}
                    <div className="nickname-box">{userInfo.nickname}</div>
                    {/* 내 포인트 짧은 사각형 */}
                    <div className="point-box">{userInfo.point}</div>
                  </div>
                  
                  <div className="mypage-footer-action">
                    {/* 버튼은 디자인상 유지하되 기능은 넣지 않았습니다 */}
                    <button className="login-join-btn">
                      로그인/회원가입
                    </button>
                  </div>
                </div>
              )}

              {modalType === 'pointStore' && <div className="centered-content">포인트 상점 내용 준비중</div>}
              
              {modalType === 'writePost' && (
                <div className="write-form">
                  <input type="text" placeholder="제목을 입력하세요" />
                  <textarea placeholder="내용을 입력하세요" rows="10"></textarea>
                  <button className="submit-btn" onClick={closeModal}>등록하기</button>
                </div>
              )}
              
              {modalType === 'restaurantDetail' && (
                <div className="detail-view">
                  <h3>{selectedItem}</h3>
                  <p>이곳은 <strong>{selectedItem}</strong>의 상세 정보입니다.</p>
                </div>
              )}
              
              {modalType === 'communityDetail' && (
                <div className="community-detail-layout">
                  <div className="post-main-content">
                    <div className="post-header-area">
                      <h2>{selectedItem}</h2>
                      <p className="post-meta">작성자: User123 | 2026-04-12</p>
                    </div>
                    <hr />
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;