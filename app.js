const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const winston = require('winston');

// Подключение к MongoDB
mongoose.connect('mongodb://localhost:27017/microblog', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Модель для записей в блоге
const Post = mongoose.model('Post', {
  title: String,
  content: String,
});

// Создание логгера
const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logfile.log' }),
  ],
});

// Express приложение
const app = express();

// Использование body-parser для обработки JSON-запросов
app.use(bodyParser.json());

// Роут для создания нового поста
/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Создать новый пост
 *     parameters:
 *       - in: body
 *         name: post
 *         description: Данные нового поста
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Post'
 *     responses:
 *       201:
 *         description: Пост успешно создан
 *         schema:
 *           $ref: '#/definitions/Post'
 *       400:
 *         description: Ошибка валидации данных
 */
app.post('/posts', async (req, res) => {
  try {
    const post = new Post(req.body);
    await post.save();
    res.status(201).send(post);
    logger.info('Создан новый пост:', post);
  } catch (error) {
    res.status(400).send(error);
    logger.error('Ошибка создания поста:', error);
  }
});

// Роут для получения всех постов
/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Получить все посты
 *     responses:
 *       200:
 *         description: Список всех постов
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Post'
 *       500:
 *         description: Внутренняя ошибка сервера
 */
app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.status(200).send(posts);
    logger.info('Получены все посты:', posts);
  } catch (error) {
    res.status(500).send(error);
    logger.error('Ошибка получения постов:', error);
  }
});

// Определение модели данных для Swagger
/**
 * @swagger
 * definitions:
 *   Post:
 *     type: object
 *     properties:
 *       title:
 *         type: string
 *         example: Название поста
 *       content:
 *         type: string
 *         example: Текст поста
 */

// Роут для обновления поста
/**
 * @swagger
 * /posts/{postId}:
 *   put:
 *     summary: Обновить пост по ID
 *     parameters:
 *       - in: path
 *         name: postId
 *         description: ID поста
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: post
 *         description: Новые данные для обновления поста
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Post'
 *     responses:
 *       200:
 *         description: Пост успешно обновлен
 *         schema:
 *           $ref: '#/definitions/Post'
 *       400:
 *         description: Ошибка валидации данных
 *       404:
 *         description: Пост не найден
 */
app.put('/posts/:postId', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.postId, req.body, {
      new: true,
    });
    if (!post) {
      return res.status(404).send({ message: 'Пост не найден' });
    }
    res.status(200).send(post);
    logger.info('Пост обновлен:', post);
  } catch (error) {
    res.status(400).send(error);
    logger.error('Ошибка обновления поста:', error);
  }
});

// Роут для удаления поста
/**
 * @swagger
 * /posts/{postId}:
 *   delete:
 *     summary: Удалить пост по ID
 *     parameters:
 *       - in: path
 *         name: postId
 *         description: ID поста
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Пост успешно удален
 *       404:
 *         description: Пост не найден
 */
app.delete('/posts/:postId', async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.postId);
    if (!post) {
      return res.status(404).send({ message: 'Пост не найден' });
    }
    res.status(204).send();
    logger.info('Пост удален:', post);
  } catch (error) {
    res.status(500).send(error);
    logger.error('Ошибка удаления поста:', error);
  }
});

// Определение конфигурации для Swagger
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: 'Microblog API',
      version: '1.0.0',
    },
  },
  apis: ['app.js'],
};

// Генерация Swagger спецификации
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Использование Swagger UI
app.use('`/api-docs`', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Запуск сервера
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
  logger.info('Сервер запущен на порту', port);
});
