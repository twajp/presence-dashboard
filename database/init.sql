CREATE TABLE IF NOT EXISTS dashboard_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dashboard_name VARCHAR(50) CHARACTER SET utf8
);

CREATE TABLE IF NOT EXISTS user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team VARCHAR(50) CHARACTER SET utf8,
    name VARCHAR(50) CHARACTER SET utf8 NOT NULL,
    presence VARCHAR(10) CHARACTER SET utf8 NOT NULL,
    note1 VARCHAR(50) CHARACTER SET utf8,
    note2 VARCHAR(50) CHARACTER SET utf8,
    check1 BOOLEAN DEFAULT FALSE,
    check2 BOOLEAN DEFAULT FALSE,
    `order` INT NOT NULL,
    dashboard_id INT,
    x INT,
    y INT
);

INSERT INTO dashboard_settings (dashboard_name) VALUES ('テスト在籍表');

INSERT INTO user (team, name, presence, note1, note2, check1, check2, `order`, dashboard_id, x, y) VALUES 
('織田軍', '織田 信長', '出席', NULL, NULL, TRUE, TRUE, 1, 1, 150, 100),
('織田軍', '柴田 勝家', '出席', NULL, NULL, TRUE, FALSE, 2, 1, 100, 200),
('織田軍', '丹羽 長秀', '出席', NULL, NULL, TRUE, TRUE, 3, 1, 200, 200),
('織田軍', '滝川 一益', '欠席', NULL, NULL, FALSE, FALSE, 4, 1, 100, 300),
('織田軍', '森 蘭丸', '出席', NULL, NULL, TRUE, TRUE, 5, 1, 150, 150),
('織田軍', '前田 利家', '出席', NULL, NULL, TRUE, FALSE, 6, 1, 200, 300),
('織田軍', '佐々 成政', '欠席', NULL, NULL, FALSE, TRUE, 7, 1, 100, 400),
('織田軍', '池田 恒興', '出席', NULL, NULL, FALSE, FALSE, 8, 1, 200, 400),

('武田軍', '武田 信玄', '出席', NULL, NULL, TRUE, TRUE, 9, 1, 450, 100),
('武田軍', '山県 昌景', '出席', NULL, NULL, TRUE, FALSE, 10, 1, 400, 200),
('武田軍', '馬場 信春', '出席', NULL, NULL, TRUE, TRUE, 11, 1, 500, 200),
('武田軍', '高坂 昌信', '欠席', NULL, NULL, FALSE, TRUE, 12, 1, 400, 300),
('武田軍', '内藤 昌豊', '出席', NULL, NULL, FALSE, FALSE, 13, 1, 500, 300),
('武田軍', '真田 昌幸', '出席', NULL, NULL, TRUE, TRUE, 14, 1, 450, 400),
('武田軍', '山本 勘助', '出席', NULL, NULL, TRUE, FALSE, 15, 1, 450, 200),

('上杉軍', '上杉 謙信', '出席', NULL, NULL, TRUE, TRUE, 16, 1, 150, 600),
('上杉軍', '直江 兼続', '出席', NULL, NULL, TRUE, TRUE, 17, 1, 150, 700),
('上杉軍', '柿崎 景家', '出席', NULL, NULL, TRUE, FALSE, 18, 1, 100, 800),
('上杉軍', '宇佐美 定満', '欠席', NULL, NULL, FALSE, FALSE, 19, 1, 200, 800),
('上杉軍', '甘糟 景持', '出席', NULL, NULL, TRUE, FALSE, 20, 1, 100, 900),
('上杉軍', '斎藤 朝信', '出席', NULL, NULL, FALSE, TRUE, 21, 1, 200, 900),
('上杉軍', '本庄 繁長', '出席', NULL, NULL, FALSE, FALSE, 22, 1, 150, 950),

('伊達軍', '伊達 政宗', '出席', NULL, NULL, TRUE, TRUE, 23, 1, 450, 600),
('伊達軍', '片倉 小十郎', '出席', NULL, NULL, TRUE, TRUE, 24, 1, 450, 700),
('伊達軍', '伊達成実', '出席', NULL, NULL, TRUE, FALSE, 25, 1, 400, 800),
('伊達軍', '鬼庭 良直', '欠席', NULL, NULL, FALSE, FALSE, 26, 1, 500, 800),
('伊達軍', '留守 政景', '出席', NULL, NULL, FALSE, TRUE, 27, 1, 400, 900),
('伊達軍', '白石 宗実', '出席', NULL, NULL, FALSE, FALSE, 28, 1, 500, 900),
('伊達軍', '原田 宗時', '出席', NULL, NULL, TRUE, FALSE, 29, 1, 450, 950),
('伊達軍', '後藤 信康', '欠席', NULL, NULL, FALSE, TRUE, 30, 1, 450, 1000);
