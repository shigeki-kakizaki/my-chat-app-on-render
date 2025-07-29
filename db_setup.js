// db_setup.js

// 1. sqlite3 モジュールを読み込む
const sqlite3 = require('sqlite3').verbose();

// 2. データベースファイルへのパスを指定
// Renderの環境変数DB_PATHがあればそれを使用し、なければローカルのパスを使用します。
const DB_PATH = process.env.DB_PATH || './chat.db';

console.log(`[DB Setup] データベースファイルパス: ${DB_PATH}`);

// 3. データベースに接続
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        // エラーが発生した場合
        console.error(`[DB Setup ERROR] データベース接続失敗: ${err.message}`);
        // 接続失敗は致命的なので、ここでプロセスを終了させることも検討
        // process.exit(1); 
    } else {
        // 接続成功の場合
        console.log('[DB Setup] データベースに正常に接続しました。');
        
        // データベースに接続後、テーブルを作成するSQLを実行
        // `messages` テーブルを作成します。
        // `IF NOT EXISTS` を使用することで、テーブルが既に存在してもエラーになりません。
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )`, (createErr) => {
            if (createErr) {
                console.error(`[DB Setup ERROR] 'messages' テーブル作成失敗: ${createErr.message}`);
                db.close(); // エラー時は接続を閉じる
            } else {
                console.log("[DB Setup] 'messages' テーブルが存在しない場合は作成されました。");
                
                // オプション: 初期データを挿入してみる（テーブルが空の場合のみ）
                // db.get() は1行のデータを取得する
                /*
                db.get("SELECT COUNT(*) AS count FROM messages", (countErr, row) => {
                    if (countErr) {
                        console.error("[DB Setup ERROR] 初期データ挿入チェック失敗:", countErr.message);
                        db.close();
                        return;
                    }

                    if (row.count === 0) {
                        // テーブルが空の場合のみ初期データを挿入
                        console.log("[DB Setup] 'messages' テーブルが空のため、初期データを挿入します。");
                        const stmt = db.prepare("INSERT INTO messages (text, timestamp) VALUES (?, ?)");
                        stmt.run("Hello, Render World!", new Date().toISOString());
                        stmt.run("これはデプロイ後の最初のメッセージです。", new Date().toISOString());
                        stmt.finalize(() => {
                            console.log("[DB Setup] 初期メッセージが正常に挿入されました。");
                            // 全ての処理が終わったらデータベース接続を閉じる
                            db.close((closeErr) => {
                                if (closeErr) {
                                    console.error("[DB Setup ERROR] データベース切断失敗:", closeErr.message);
                                } else {
                                    console.log("[DB Setup] データベース接続を閉じました。");
                                }
                            });
                        });
                    } else {
                        console.log("[DB Setup] 'messages' テーブルにデータが既に存在するため、初期データは挿入しませんでした。");
                        // 既にデータがある場合は初期データ挿入をスキップし、接続を閉じる
                        db.close((closeErr) => {
                            if (closeErr) {
                                console.error("[DB Setup ERROR] データベース切断失敗:", closeErr.message);
                            } else {
                                console.log("[DB Setup] データベース接続を閉じました。");
                            }
                        });
                    }
                });
                */
               // 初期データ挿入をコメントアウトした場合、ここで接続を閉じます
                db.close((closeErr) => {
                    if (closeErr) {
                        console.error("[DB Setup ERROR] データベース切断失敗 (初期データ挿入スキップ時):", closeErr.message);
                    } else {
                        console.log("[DB Setup] データベース接続を閉じました (初期データ挿入スキップ時)。");
                    }
                });
            }
        });
    }
});