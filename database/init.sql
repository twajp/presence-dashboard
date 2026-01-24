CREATE TABLE IF NOT EXISTS user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team VARCHAR(50) CHARACTER SET utf8,
    name VARCHAR(50) CHARACTER SET utf8 NOT NULL,
    presence VARCHAR(10) CHARACTER SET utf8 NOT NULL,
    note1 VARCHAR(50) CHARACTER SET utf8,
    note2 VARCHAR(50) CHARACTER SET utf8,
    check1 BOOLEAN DEFAULT FALSE,
    check2 BOOLEAN DEFAULT FALSE
);

INSERT INTO user (team, name, presence, note1, note2, check1, check2) VALUES 
('織田軍', '織田 信長', '出席', NULL, NULL, TRUE, TRUE),
('織田軍', '柴田 勝家', '出席', NULL, NULL, TRUE, FALSE),
('織田軍', '丹羽 長秀', '出席', NULL, NULL, TRUE, TRUE),
('織田軍', '滝川 一益', '欠席', NULL, NULL, FALSE, FALSE),
('織田軍', '森 蘭丸', '出席', NULL, NULL, TRUE, TRUE),
('織田軍', '前田 利家', '出席', NULL, NULL, TRUE, FALSE),
('織田軍', '佐々 成政', '欠席', NULL, NULL, FALSE, TRUE),
('織田軍', '池田 恒興', '出席', NULL, NULL, FALSE, FALSE),

('武田軍', '武田 信玄', '出席', NULL, NULL, TRUE, TRUE),
('武田軍', '山県 昌景', '出席', NULL, NULL, TRUE, FALSE),
('武田軍', '馬場 信春', '出席', NULL, NULL, TRUE, TRUE),
('武田軍', '高坂 昌信', '欠席', NULL, NULL, FALSE, TRUE),
('武田軍', '内藤 昌豊', '出席', NULL, NULL, FALSE, FALSE),
('武田軍', '真田 昌幸', '出席', NULL, NULL, TRUE, TRUE),
('武田軍', '山本 勘助', '出席', NULL, NULL, TRUE, FALSE),

('上杉軍', '上杉 謙信', '出席', NULL, NULL, TRUE, TRUE),
('上杉軍', '直江 兼続', '出席', NULL, NULL, TRUE, TRUE),
('上杉軍', '柿崎 景家', '出席', NULL, NULL, TRUE, FALSE),
('上杉軍', '宇佐美 定満', '欠席', NULL, NULL, FALSE, FALSE),
('上杉軍', '甘糟 景持', '出席', NULL, NULL, TRUE, FALSE),
('上杉軍', '斎藤 朝信', '出席', NULL, NULL, FALSE, TRUE),
('上杉軍', '本庄 繁長', '出席', NULL, NULL, FALSE, FALSE),

('伊達軍', '伊達 政宗', '出席', NULL, NULL, TRUE, TRUE),
('伊達軍', '片倉 小十郎', '出席', NULL, NULL, TRUE, TRUE),
('伊達軍', '伊達成実', '出席', NULL, NULL, TRUE, FALSE),
('伊達軍', '鬼庭 良直', '欠席', NULL, NULL, FALSE, FALSE),
('伊達軍', '留守 政景', '出席', NULL, NULL, FALSE, TRUE),
('伊達軍', '白石 宗実', '出席', NULL, NULL, FALSE, FALSE),
('伊達軍', '原田 宗時', '出席', NULL, NULL, TRUE, FALSE),
('伊達軍', '後藤 信康', '欠席', NULL, NULL, FALSE, TRUE);
