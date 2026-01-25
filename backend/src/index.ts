import express from 'express';
import { createConnection } from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    req.method === 'OPTIONS' ? res.sendStatus(200) : next();
});

let connection: any;

(async () => {
    connection = await createConnection({
        host: process.env.DB_HOST || 'database',
        user: process.env.DB_USER || 'user',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'database-dev',
    });

    app.get('/api/dashboards', async (req, res) => {
        const [rows] = await connection.execute('SELECT * FROM dashboard_settings');
        res.json(rows);
    });

    app.post('/api/dashboards', async (req, res) => {
        const { dashboard_name } = req.body;
        const [result] = await connection.execute('INSERT INTO dashboard_settings (dashboard_name) VALUES (?)', [dashboard_name]);
        res.json({ success: true, id: (result as any).insertId });
    });

    app.get('/api/users/:dashboardId', async (req, res) => {
        const [rows] = await connection.execute('SELECT * FROM user WHERE dashboard_id = ? ORDER BY `order`', [req.params.dashboardId]);
        res.json(rows);
    });

    app.put('/api/users/:id', async (req, res) => {
        const { name, presence, note1, note2, x, y } = req.body;
        await connection.execute(
            'UPDATE user SET name=?, presence=?, note1=?, note2=?, x=?, y=? WHERE id=?',
            [name, presence, note1, note2, x, y, req.params.id]
        );
        res.json({ success: true });
    });

    app.post('/api/users', async (req, res) => {
        const { team, name, presence, dashboard_id, x, y, order } = req.body;
        const [result] = await connection.execute(
            'INSERT INTO user (team, name, presence, dashboard_id, x, y, `order`) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [team, name, presence, dashboard_id, x, y, order]
        );
        res.json({ success: true, id: (result as any).insertId });
    });

    app.delete('/api/users/:id', async (req, res) => {
        await connection.execute('DELETE FROM user WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    });

    app.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
        console.log(`📊 GET /api/dashboards - Get dashboard list`);
        console.log(`➕ POST /api/dashboards - Create dashboard`);
        console.log(`👥 GET /api/users - Get user list`);
        console.log(`👤 GET /api/users/:dashboardId - Get users by dashboard`);
        console.log(`✏️  PUT /api/users/:id - Update user`);
        console.log(`➕ POST /api/users - Create user`);
        console.log(`🗑️  DELETE /api/users/:id - Delete user`);
    });
})();
