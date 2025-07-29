// db_setup.js


// 1. sqlite3 モジュールを読み込む
const sqlite3 = require('sqlite3').verbose();


// 2. データベースファイルへのパスを指定
// './chat.db' は、db_setup.js と同じディレクトリに chat.db というファイルを作成/接続する意味
const DB_PATH = process.env.DB_PATH || './chat.db';


// 3. データベースに接続
// new sqlite3.Database() は、指定されたパスにデータベースファイルがなければ新しく作成し、あれば接続します。
// コールバック関数は、接続が成功したか失敗したかを教えてくれます。
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        // エラーが発生した場合
        console.error('データベース接続エラー:', err.message);
    } else {
        // 接続成功の場合
        console.log('データベースに接続しました:', DB_PATH);
        
        // データベースに接続後、テーブルを作成するSQLを実行
        // `messages` テーブルを作成します。
        // id: メッセージのユニークなID (自動的に増える整数、主キー)
        // text: メッセージの内容 (テキスト形式、空にできない)
        // timestamp: メッセージが作成された日時 (テキスト形式)
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            timestamp TEXT
        )`, (createErr) => {
            if (createErr) {
                console.error('テーブル作成エラー:', createErr.message);
            } else {
                console.log('`messages` テーブルが正常に作成または既に存在しています。');
                
                // オプション: 初期データを挿入してみる（テーブルが空の場合のみ）
                db.get("SELECT COUNT(*) AS count FROM messages", (countErr, row) => {
                    if (countErr) {
                        console.error("初期データ挿入チェックエラー:", countErr.message);
                        return;
                    }
                    if (row.count === 0) {
                        const stmt = db.prepare("INSERT INTO messages (text, timestamp) VALUES (?, ?)");
                        stmt.run("Hello, SQLite!", new Date().toISOString());
                        stmt.run("これが最初のメッセージです。", new Date().toISOString());
                        stmt.finalize(() => {
                            console.log("初期メッセージが挿入されました。");
                            // 全ての処理が終わったらデータベース接続を閉じる
                            db.close((closeErr) => {
                                if (closeErr) {
                                    console.error("データベース切断エラー:", closeErr.message);
                                } else {
                                    console.log("データベース接続を閉じました。");
                                }
                            });
                        });
                    } else {
                        console.log("`messages` テーブルにデータが既に存在するため、初期データは挿入しませんでした。");
                        // 全ての処理が終わったらデータベース接続を閉じる
                        db.close((closeErr) => {
                            if (closeErr) {
                                console.error("データベース切断エラー:", closeErr.message);
                            } else {
                                console.log("データベース接続を閉じました。");
                            }
                        });
                    }
                });
            }
        });
    }
});

