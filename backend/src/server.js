require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

// Log das variáveis de ambiente
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_DATABASE:', process.env.DB_DATABASE);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_PORT:', process.env.DB_PORT);

// Configuração do CORS
const corsOptions = {
    origin: 'http://127.0.0.1:5500', // Altere para o domínio que você quer permitir
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true, // Se você precisa de cookies, adicionar isto
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());

// Configuração do armazenamento do multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../frontend/uploads'); // Caminho relativo correto
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Configuração do Pool do PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Teste de conexão com o banco de dados
pool.connect((err, client, release) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('Conectado ao banco de dados com sucesso');
        release();
    }
});

// Rotas da API
// Rota para obter todos os lanches
app.get('/api/lanches', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM lanches ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao obter lanches:', err.message);
        res.status(500).send('Servidor Erro');
    }
});

// Rota para adicionar um novo lanche
app.post('/api/lanches', upload.single('imagem'), async (req, res) => {
    const { nome, descricao, preco, categoria } = req.body;
    const imagem_url = req.file ? `/uploads/${req.file.filename}` : null;

    console.log('Dados recebidos no backend:', { nome, descricao, preco, categoria, imagem_url });

    try {
        const newLanche = await pool.query(
            'INSERT INTO lanches (nome, descricao, preco, imagem_url, categoria) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nome, descricao, preco, imagem_url, categoria]
        );
        console.log('Novo lanche adicionado:', newLanche.rows[0]);
        res.json(newLanche.rows[0]);
    } catch (err) {
        console.error('Erro ao adicionar lanche:', err.message);
        res.status(500).send('Servidor Erro');
    }
});

// Rota para atualizar um lanche
app.put('/api/lanches/:id', upload.single('imagem'), async (req, res) => {
    const { id } = req.params;
    const { nome, descricao, preco, categoria } = req.body;
    const imagem_url = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        const updateLanche = await pool.query(
            'UPDATE lanches SET nome = $1, descricao = $2, preco = $3, imagem_url = $4, categoria = $5 WHERE id = $6 RETURNING *',
            [nome, descricao, preco, imagem_url, categoria, id]
        );
        if (updateLanche.rows.length === 0) {
            return res.status(404).send('Lanche não encontrado');
        }
        res.json(updateLanche.rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar lanche:', err.message);
        res.status(500).send('Servidor Erro');
    }
});

// Rota para deletar um lanche
app.delete('/api/lanches/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deleteLanche = await pool.query('DELETE FROM lanches WHERE id = $1 RETURNING *', [id]);

        if (deleteLanche.rows.length === 0) {
            return res.status(404).send('Lanche não encontrado');
        }

        res.json(deleteLanche.rows[0]);
    } catch (err) {
        console.error('Erro ao deletar lanche:', err.message);
        res.status(500).send('Servidor Erro');
    }
});

// Configuração para servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../../frontend/uploads')));

// Rota para servir o index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend', 'index.html'));
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
