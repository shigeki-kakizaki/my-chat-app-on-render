// app_with_db.js

const express = require('express');
const app = express();
const port = 3000;

// CORSモジュールを読み込み
const cors = require('cors'); 

// SQLite3モジュールの読み込み
const sqlite3 = require('sqlite3').verbose();
// データベースファイルへのパス
const DB_PATH = './chat.db';

// データベース接続オブジェクトの作成
// 必要に応じてPromise化するためのヘルパー関数
function openDb() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(db);
            }
        });
    });
}

// ミドルウェア設定
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // フロントエンドファイルを配信

// --- API エンドポイント (データベース連携) ---

// GET /api/messages: 全てのメッセージを取得
app.get('/api/messages', async (req, res) => {
    let db; // db接続オブジェクト
    try {
        db = await openDb(); // データベース接続を開く
        // SQL: messagesテーブルから全ての行を取得し、idで昇順に並べ替える
        const sql = `SELECT id, text, timestamp FROM messages ORDER BY id ASC`;
        
        // db.all() は複数の行を取得するための非同期メソッド
        const messages = await new Promise((resolve, reject) => {
            db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
        
        console.log('GET /api/messages: メッセージ取得成功');
        res.json(messages);
    } catch (error) {
        console.error('GET /api/messages: エラー発生:', error.message);
        res.status(500).json({ error: 'Failed to retrieve messages' });
    } finally {
        if (db) db.close(); // データベース接続を閉じる
    }
});

// POST /api/messages: 新しいメッセージを作成
app.post('/api/messages', async (req, res) => {
    let db;
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
        return res.status(400).json({ error: 'Message text is required and must be a non-empty string.' });
    }

    const timestamp = new Date().toISOString(); // 現在のタイムスタンプ

    try {
        db = await openDb();
        // SQL: messagesテーブルに新しい行を挿入
        // プレースホルダー (?) を使うことで、SQLインジェクション攻撃を防ぐ
        const sql = `INSERT INTO messages (text, timestamp) VALUES (?, ?)`;
        
        // db.run() は行を挿入/更新/削除するための非同期メソッド
        // this.lastID で挿入された行のIDを取得
        const result = await new Promise((resolve, reject) => {
            db.run(sql, [text.trim(), timestamp], function(err) { // ここでfunction()を使うとthisが正しく参照できる
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, text: text.trim(), timestamp: timestamp });
                }
            });
        });

        console.log('POST /api/messages: メッセージ作成成功', result);
        res.status(201).json(result); // 201 Created ステータスと、作成されたメッセージを返す
    } catch (error) {
        console.error('POST /api/messages: エラー発生:', error.message);
        res.status(500).json({ error: 'Failed to create message' });
    } finally {
        if (db) db.close();
    }
});

// --- サーバーの起動 ---
app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
    console.log(`Frontend can be accessed at http://localhost:${port}/`);
    console.log('Ctrl+C でサーバーを停止できます。');
});
