// server.js (または chat_db_server.js)

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// SQLite3モジュールの読み込み
const sqlite3 = require('sqlite3').verbose();
// データベースファイルへのパス
const DB_PATH = process.env.DB_PATH ||'chat.db'; // データベースファイル名を指定

// データベース接続オブジェクトのPromise化ヘルパー関数
// これにより、async/await でデータベース操作を同期的に書けるようになります
function openDb() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                reject(err); // 接続エラーがあればPromiseを拒否
            } else {
                resolve(db); // 接続成功でdbオブジェクトを解決
            }
        });
    });
}

// ミドルウェア設定
const cors = require('cors'); // CORSモジュールを読み込み
app.use(cors()); // CORSを有効にする
app.use(express.json()); // JSON形式のリクエストボディをパース
app.use(express.static('public')); // publicフォルダ内の静的ファイルを配信

// --- API エンドポイント (データベース連携) ---

// GET /api/messages: 全てのメッセージを取得
app.get('/api/messages', async (req, res) => {
    let db; // データベース接続オブジェクトを保持する変数
    try {
        db = await openDb(); // データベース接続を開く
        // SQLクエリ: messagesテーブルからid, text, timestampを取得し、idで昇順に並べ替える
        const sql = `SELECT id, text, timestamp FROM messages ORDER BY id ASC`;
        
        // db.all() メソッドで複数の行を取得する（Promiseでラップ）
        const messages = await new Promise((resolve, reject) => {
            db.all(sql, [], (err, rows) => { // 第二引数 [] はSQLのプレースホルダーに渡す値がないことを示す
                if (err) {
                    reject(err);
                } else {
                    resolve(rows); // 取得した行（rows）を解決
                }
            });
        });
        
        console.log('GET /api/messages: メッセージ取得成功');
        res.json(messages); // 取得したメッセージをJSON形式でクライアントに返す
    } catch (error) {
        console.error('GET /api/messages: エラー発生:', error.message);
        res.status(500).json({ error: 'Failed to retrieve messages from database.' }); // 500エラーを返す
    } finally {
        if (db) db.close(); // 処理が終わったら必ずデータベース接続を閉じる
    }
});

// POST /api/messages: 新しいメッセージを作成
app.post('/api/messages', async (req, res) => {
    let db;
    const { text } = req.body; // リクエストボディからメッセージテキストを取得

    // 入力値のバリデーション
    if (!text || typeof text !== 'string' || text.trim() === '') {
        return res.status(400).json({ error: 'Message text is required and must be a non-empty string.' });
    }

    const timestamp = new Date().toISOString(); // 現在のISO形式日時文字列

    try {
        db = await openDb();
        // SQLクエリ: messagesテーブルに新しいメッセージを挿入
        // `?` はプレースホルダー。SQLインジェクション対策に必須
        const sql = `INSERT INTO messages (text, timestamp) VALUES (?, ?)`;
        
        // db.run() メソッドでSQLを実行する（挿入、更新、削除用。Promiseでラップ）
        const result = await new Promise((resolve, reject) => {
            // function(err) { ... } を使うと this.lastID が利用できる
            db.run(sql, [text.trim(), timestamp], function(err) { 
                if (err) {
                    reject(err);
                } else {
                    // 挿入されたメッセージのIDを含むオブジェクトを解決
                    resolve({ id: this.lastID, text: text.trim(), timestamp: timestamp });
                }
            });
        });

        console.log('POST /api/messages: メッセージ作成成功', result.id);
        res.status(201).json(result); // 201 Created ステータスと作成されたメッセージを返す
    } catch (error) {
        console.error('POST /api/messages: エラー発生:', error.message);
        res.status(500).json({ error: 'Failed to create message in database.' });
    } finally {
        if (db) db.close();
    }
});

// --- サーバーの起動 ---
app.listen(port, () => {
    // サーバー起動時のメッセージも、ポート変数を使うように修正
    console.log(`Backend server running on port ${port}`);
    console.log(`Open your browser to: http://localhost:${port}/ (development)`);
});
