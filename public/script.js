// script.js

// 1. DOM要素の取得
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const messageList = document.getElementById('messageList');

// 2. バックエンドAPIのURL定義
const API_BASE_URL = 'http://localhost:3000/api/messages'; // バックエンドAPIのエンドポイント

// 3. メッセージをHTMLリストに追加する関数
function addMessageToDOM(message) {
    const listItem = document.createElement('li'); // 新しい<li>要素を作成
    listItem.innerHTML = `
        <div class="message-text">${message.text}</div>
        <div class="message-timestamp">${new Date(message.timestamp).toLocaleString()}</div>
    `;
    messageList.appendChild(listItem); // メッセージリストに<li>を追加
    messageList.scrollTop = messageList.scrollHeight; // スクロールを最下部に
}

// 4. 既存のメッセージをAPIから取得して表示する関数
async function fetchMessages() {
    try {
        const response = await fetch(API_BASE_URL); // GETリクエストを送信
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const messages = await response.json(); // レスポンスボディをJSONとしてパース
        
        messageList.innerHTML = ''; // 既存のリストをクリア
        messages.forEach(addMessageToDOM); // (A) 配列の各要素に対してaddMessageToDOMを実行
    } catch (error) {
        console.error('Failed to fetch messages:', error);
        alert('メッセージの取得に失敗しました。サーバーが起動しているか確認してください。');
    }
}

// 5. メッセージを送信する関数
async function sendMessage() {
    const text = messageInput.value.trim(); // 入力値を取得
    if (!text) { // バリデーション
        alert('メッセージを入力してください。');
        return;
    }

    try {
        const response = await fetch(API_BASE_URL, { // POSTリクエストを送信
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text }) // JSON形式でデータを送信
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
        }

        const newMessage = await response.json(); // サーバーから返された新しいメッセージを取得
        addMessageToDOM(newMessage); // 新しいメッセージをDOMに追加
        messageInput.value = ''; // 入力フィールドをクリア

    } catch (error) {
        console.error('Failed to send message:', error);
        alert(`メッセージの送信に失敗しました: ${error.message}`);
    }
}

// 6. イベントリスナーの設定
sendMessageBtn.addEventListener('click', sendMessage); // クリックイベント
messageInput.addEventListener('keypress', (e) => { // キープレスイベント
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// 7. ページロード時にメッセージを取得
fetchMessages(); // アプリケーション起動時にメッセージ一覧を読み込む