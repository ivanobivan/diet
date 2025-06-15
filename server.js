require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const PASSWORD = process.env.PASSWORD;

app.use(cors()); // Разрешить все источники
app.use(express.json());
app.use(express.static('public')); // Статические файлы (index.html, css, js)

// Авторизация
app.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === PASSWORD) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// Прием и сохранение данных
app.post('/submit', (req, res) => {
    const entry = req.body;

    let data = [];

    if (fs.existsSync(DATA_FILE)) {
        try {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
            data = fileContent ? JSON.parse(fileContent) : [];
        } catch (err) {
            return res.status(500).json({ error: 'Ошибка чтения файла данных' });
        }
    }

    data.push(entry);

    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка записи файла данных' });
    }
});

app.get('/results', (req, res) => {
    const { password } = req.query;

    if (password !== PASSWORD) {
        return res.status(401).send('Неверный пароль');
    }

    if (!fs.existsSync(DATA_FILE)) {
        return res.send('<h2>Нет данных</h2>');
    }

    let data;
    try {
        data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) || [];
    } catch (e) {
        return res.status(500).send('<h2>Ошибка чтения данных</h2>');
    }

    // Сортировка по дате и времени (новые сначала)
    data.sort((a, b) => {
        const dateA = new Date(`${a.currentDate}T${a.currentTime}`);
        const dateB = new Date(`${b.currentDate}T${b.currentTime}`);
        return dateB - dateA;
    });

    const rows = data.map((entry, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${entry.currentDate} ${entry.currentTime}</td>
      <td>${entry.meal || ''}</td>
      <td>${entry.food || ''}</td>
      <td>${entry.drink || ''}</td>
      <td>${entry.context || ''}</td>
    </tr>
  `).join('');

    const html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8" />
      <title>Дневник питания</title>
      <style>
        body {
          font-family: sans-serif;
          padding: 2rem;
          background: #f9f9f9;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }
        th, td {
          border: 1px solid #ccc;
          padding: 0.5rem;
          text-align: left;
        }
        th {
          background: #98FBCB;
        }
        tr:nth-child(even) {
          background: #f0f0f0;
        }
        h1 {
          color: #444;
        }
      </style>
    </head>
    <body>
      <h1>Записи дневника</h1>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Дата и время</th>
            <th>Прием пищи</th>
            <th>Еда</th>
            <th>Напитки</th>
            <th>Контекст</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </body>
    </html>
  `;

    res.send(html);
});


// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
