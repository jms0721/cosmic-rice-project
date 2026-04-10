import React, { useState } from 'react';
import './App.css';

function App() {
  // 마이페이지 창이 열려있는지 상태 관리
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);

  return (
    <div className="container">
      {/* 1. 왼쪽: 식당 목록 */}
      <aside className="sidebar left-side">
        <h2>식당 목록</h2>
      </aside>

      {/* 2. 중앙: 지도 위에 마이페이지를 띄우는 구조 */}
      <main className="main-content">
        <div className="search-bar">
          <input type="text" placeholder="지역 검색" />
        </div>
        
        <div className="content-area">
          {/* 지도는 항상 밑에 깔려 있음 */}
          <div className="map-view">
            <h2>지도</h2>
          </div>

          {/* isMyPageOpen이 true일 때만 마이페이지 창이 나타남 */}
          {isMyPageOpen && (
            <div className="mypage-modal">
              <div className="modal-header">
                <button className="close-btn" onClick={() => setIsMyPageOpen(false)}>X</button>
              </div>
              <div className="modal-body">
                <h2>마이페이지</h2>
                <button className="login-btn">로그인 / 회원가입</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 3. 오른쪽: 마이페이지 버튼 */}
      <aside className="sidebar right-side">
        <div className="user-nav">
          <button onClick={() => setIsMyPageOpen(true)}>마이페이지</button>
          <button>내 포인트</button>
        </div>
        <div className="community-area">
          <h2>커뮤니티</h2>
        </div>
      </aside>
    </div>
  );
}

export default App;