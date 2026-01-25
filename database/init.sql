CREATE TABLE IF NOT EXISTS dashboard_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dashboard_name VARCHAR(50) CHARACTER SET utf8,
    team_label VARCHAR(50) CHARACTER SET utf8 DEFAULT 'Team',
    name_label VARCHAR(50) CHARACTER SET utf8 DEFAULT 'Name',
    note1_label VARCHAR(50) CHARACTER SET utf8 DEFAULT 'Note 1',
    note2_label VARCHAR(50) CHARACTER SET utf8 DEFAULT 'Note 2'
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
('織田軍', '織田 信長', 'present', NULL, NULL, TRUE, TRUE, 1, 1, 20, 50),
('織田軍', '柴田 勝家', 'present', NULL, NULL, TRUE, FALSE, 2, 1, 130, 20),
('織田軍', '丹羽 長秀', 'present', NULL, NULL, TRUE, TRUE, 3, 1, 240, 20),
('織田軍', '滝川 一益', 'off', NULL, NULL, FALSE, FALSE, 4, 1, 350, 20),
('織田軍', '森 蘭丸', 'remote', NULL, NULL, TRUE, TRUE, 5, 1, 460, 20),
('織田軍', '前田 利家', 'present', NULL, NULL, TRUE, FALSE, 6, 1, 130, 80),
('織田軍', '佐々 成政', 'present', NULL, NULL, FALSE, TRUE, 7, 1, 240, 80),
('織田軍', '池田 恒興', 'trip', NULL, NULL, FALSE, FALSE, 8, 1, 350, 80),
('武田軍', '武田 信玄', 'present', NULL, NULL, TRUE, TRUE, 9, 1, 20, 190),
('武田軍', '山県 昌景', 'present', NULL, NULL, TRUE, FALSE, 10, 1, 130, 160),
('武田軍', '馬場 信春', 'present', NULL, NULL, TRUE, TRUE, 11, 1, 240, 160),
('武田軍', '高坂 昌信', 'present', NULL, NULL, FALSE, TRUE, 12, 1, 130, 220),
('武田軍', '内藤 昌豊', 'remote', NULL, NULL, FALSE, FALSE, 13, 1, 350, 160),
('武田軍', '真田 昌幸', 'present', NULL, NULL, TRUE, TRUE, 14, 1, 240, 220),
('武田軍', '山本 勘助', 'trip', NULL, NULL, TRUE, FALSE, 15, 1, 350, 220),
('上杉軍', '上杉 謙信', 'present', NULL, NULL, TRUE, TRUE, 16, 1, 20, 330),
('上杉軍', '直江 兼続', 'present', NULL, NULL, TRUE, TRUE, 17, 1, 130, 300),
('上杉軍', '柿崎 景家', 'present', NULL, NULL, TRUE, FALSE, 18, 1, 240, 300),
('上杉軍', '宇佐美 定満', 'remote', NULL, NULL, FALSE, FALSE, 19, 1, 350, 300),
('上杉軍', '甘糟 景持', 'present', NULL, NULL, TRUE, FALSE, 20, 1, 130, 360),
('上杉軍', '斎藤 朝信', 'present', NULL, NULL, FALSE, TRUE, 21, 1, 240, 360),
('上杉軍', '本庄 繁長', 'trip', NULL, NULL, FALSE, FALSE, 22, 1, 350, 360),
('伊達軍', '伊達 政宗', 'present', NULL, NULL, TRUE, TRUE, 23, 1, 20, 470),
('伊達軍', '片倉 小十郎', 'present', NULL, NULL, TRUE, TRUE, 24, 1, 130, 440),
('伊達軍', '伊達成実', 'present', NULL, NULL, TRUE, FALSE, 25, 1, 240, 440),
('伊達軍', '鬼庭 良直', 'remote', NULL, NULL, FALSE, FALSE, 26, 1, 350, 440),
('伊達軍', '留守 政景', 'present', NULL, NULL, FALSE, TRUE, 27, 1, 130, 500),
('伊達軍', '白石 宗実', 'off', NULL, NULL, FALSE, FALSE, 28, 1, 240, 500),
('伊達軍', '原田 宗時', 'trip', NULL, NULL, TRUE, FALSE, 29, 1, 350, 500),
('伊達軍', '後藤 信康', 'remote', NULL, NULL, FALSE, TRUE, 30, 1, 460, 500);
