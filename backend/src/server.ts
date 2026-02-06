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

// Health check endpoint should be available immediately
app.get('/health', async (req, res) => {
    if (!connection) {
        return res.status(503).send('Database not ready');
    }
    try {
        await connection.ping();
        res.send('OK');
    } catch (error) {
        res.status(503).send('Database connection failed');
    }
});

(async () => {
    try {
        // Wait for database connection with retry logic
        let retries = 30;
        while (retries > 0) {
            try {
                connection = await createConnection({
                    host: process.env.DB_HOST || 'database',
                    user: process.env.DB_USER || 'user',
                    password: process.env.DB_PASSWORD || 'password',
                    database: process.env.DB_NAME || 'database-dev',
                });
                console.log('✅ Database connected');
                break;
            } catch (error) {
                retries--;
                console.log(`⏳ Waiting for database... (${retries} retries left)`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                if (retries === 0) throw error;
            }
        }

        app.get('/api/dashboards', async (req, res) => {
            const [rows] = await connection.execute('SELECT * FROM dashboard_settings');
            res.json(rows);
        });

        app.post('/api/dashboards', async (req, res) => {
            const { dashboard_name } = req.body;
            const [result] = await connection.execute('INSERT INTO dashboard_settings (dashboard_name) VALUES (?)', [dashboard_name]);
            res.json({ success: true, id: (result as any).insertId });
        });

        app.put('/api/dashboards/:id', async (req, res) => {
            const { dashboard_name } = req.body;
            await connection.execute(
                'UPDATE dashboard_settings SET dashboard_name = ? WHERE id = ?',
                [dashboard_name, req.params.id]
            );
            res.json({ success: true });
        });

        app.get('/api/columns/:dashboardId', async (req, res) => {
            const [rows]: any = await connection.execute('SELECT * FROM dashboard_settings WHERE id = ?', [req.params.dashboardId]);
            res.json(rows[0] || { team_label: 'Team', name_label: 'Name', note1_label: 'Note 1', note2_label: 'Note 2', grid_width: 40, grid_height: 70, notes: '' });
        });

        app.put('/api/columns/:dashboardId', async (req, res) => {
            const { team_label, name_label, note1_label, note2_label, grid_width, grid_height, notes } = req.body;
            await connection.execute(
                'INSERT INTO dashboard_settings (id, team_label, name_label, note1_label, note2_label, grid_width, grid_height, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE team_label=?, name_label=?, note1_label=?, note2_label=?, grid_width=?, grid_height=?, notes=?',
                [req.params.dashboardId, team_label, name_label, note1_label, note2_label, grid_width, grid_height, notes, team_label, name_label, note1_label, note2_label, grid_width, grid_height, notes]
            );
            res.json({ success: true });
        });

        app.get('/api/users/:dashboardId', async (req, res) => {
            const [rows] = await connection.execute('SELECT * FROM users WHERE dashboard_id = ? ORDER BY `order` ASC', [req.params.dashboardId]);
            res.json(rows);
        });

        app.put('/api/users/:id', async (req, res) => {
            const { team, name, presence, note1, note2, x, y, order } = req.body;
            await connection.execute(
                'UPDATE users SET team=?, name=?, presence=?, note1=?, note2=?, x=?, y=?, `order`=? WHERE id=?',
                [team, name, presence, note1, note2, x, y, order, req.params.id]
            );
            res.json({ success: true });
        });

        app.post('/api/users', async (req, res) => {
            const { team, name, presence, dashboard_id, x, y, order } = req.body;
            const [result] = await connection.execute(
                'INSERT INTO users (team, name, presence, dashboard_id, x, y, `order`) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [team, name, presence, dashboard_id, x, y, order]
            );
            res.json({ success: true, id: (result as any).insertId });
        });

        app.delete('/api/users/:id', async (req, res) => {
            await connection.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
            res.json({ success: true });
        });

        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
            console.log(`📊 GET /api/dashboards - Get dashboard list`);
            console.log(`➕ POST /api/dashboards - Create dashboard`);
            console.log(`✏️  PUT /api/dashboards/:id - Update dashboard`);
            console.log(`📋 GET /api/columns/:dashboardId - Get dashboard columns`);
            console.log(`✏️  PUT /api/columns/:dashboardId - Update dashboard columns`);
            console.log(`👥 GET /api/users - Get user list`);
            console.log(`👤 GET /api/users/:dashboardId - Get users by dashboard`);
            console.log(`✏️  PUT /api/users/:id - Update user`);
            console.log(`➕ POST /api/users - Create user`);
            console.log(`🗑️  DELETE /api/users/:id - Delete user`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
})();
