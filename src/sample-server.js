// ---------------------------------------------------------------------------
// SAMPLE / STUB server — NO MongoDB required.
// Serves the same routes as the real app (books, authors, users, ops) from
// in-memory stub data so the container can run and deploy without a database.
// Swap the Dockerfile CMD back to "src/server.js" once MongoDB is wired up.
// ---------------------------------------------------------------------------
const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ---- In-memory stub data --------------------------------------------------
let authors = [
  { _id: "auth_1", name: "George Orwell", bio: "English novelist and essayist.", birthDate: "1903-06-25", books: ["book_1"] },
  { _id: "auth_2", name: "Jane Austen", bio: "English novelist.", birthDate: "1775-12-16", books: ["book_2"] },
];

let books = [
  { _id: "book_1", bookId: "B-001", title: "1984", description: "Dystopian classic.", publishedYear: 1949, genre: "Dystopian", author: "auth_1", coverImage: "https://example.com/1984.jpg" },
  { _id: "book_2", bookId: "B-002", title: "Pride and Prejudice", description: "A romantic novel.", publishedYear: 1813, genre: "Romance", author: "auth_2", coverImage: "https://example.com/pride.jpg" },
  { _id: "book_3", bookId: "B-003", title: "Animal Farm", description: "Political satire.", publishedYear: 1945, genre: "Satire", author: "auth_1", coverImage: "https://example.com/animalfarm.jpg" },
];

let users = [
  { _id: "user_1", userId: "U-001", username: "demo", email: "demo@example.com", role: "user" },
];

let seq = 100;
const nextId = (prefix) => `${prefix}_${++seq}`;

// ---- Ops ------------------------------------------------------------------
app.get("/health", (_req, res) => res.status(200).json({ status: "ok", service: "nodejs-bookstore-api" }));
app.get("/readyz", (_req, res) => res.status(200).json({ status: "ready", dependencies: { database: "stub (in-memory)" } }));

// ---- Books ----------------------------------------------------------------
app.get("/api/books", (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const start = (page - 1) * limit;
  res.status(200).json({ status: "OK", data: books.slice(start, start + limit) });
});

app.post("/api/books/addBook", (req, res) => {
  const { bookId, title, author } = req.body || {};
  if (!bookId || !title || !author) {
    return res.status(400).json({ status: "ERROR", message: "bookId, title and author are required" });
  }
  const book = { _id: nextId("book"), ...req.body };
  books.push(book);
  res.status(201).json(book);
});

app.get("/api/books/:id", (req, res) => {
  const book = books.find((b) => b._id === req.params.id || b.bookId === req.params.id);
  if (!book) return res.status(404).json({ status: "ERROR", message: "Book not found" });
  res.status(200).json(book);
});

app.patch("/api/books/update/:id", (req, res) => {
  const book = books.find((b) => b._id === req.params.id || b.bookId === req.params.id);
  if (!book) return res.status(404).json({ status: "ERROR", message: "Book not found" });
  Object.assign(book, req.body);
  res.status(200).json(book);
});

app.delete("/api/books/delete/:id", (req, res) => {
  const before = books.length;
  books = books.filter((b) => b._id !== req.params.id && b.bookId !== req.params.id);
  if (books.length === before) return res.status(404).json({ status: "ERROR", message: "Book not found" });
  res.status(200).json({ status: "OK", message: "Book deleted" });
});

// ---- Authors --------------------------------------------------------------
app.get("/api/authors", (_req, res) => res.status(200).json(authors));

app.post("/api/authors", (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ status: "ERROR", message: "name is required" });
  const author = { _id: nextId("auth"), books: [], ...req.body };
  authors.push(author);
  res.status(201).json(author);
});

app.get("/api/authors/:id", (req, res) => {
  const author = authors.find((a) => a._id === req.params.id);
  if (!author) return res.status(404).json({ status: "ERROR", message: "Author not found" });
  res.status(200).json(author);
});

app.put("/api/authors/:id", (req, res) => {
  const author = authors.find((a) => a._id === req.params.id);
  if (!author) return res.status(404).json({ status: "ERROR", message: "Author not found" });
  Object.assign(author, req.body);
  res.status(200).json(author);
});

app.delete("/api/authors/:id", (req, res) => {
  const before = authors.length;
  authors = authors.filter((a) => a._id !== req.params.id);
  if (authors.length === before) return res.status(404).json({ status: "ERROR", message: "Author not found" });
  res.status(200).json({ status: "OK", message: "Author deleted" });
});

// ---- Users & Auth ---------------------------------------------------------
app.post("/u/register", (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ status: "ERROR", message: "username, email and password are required" });
  }
  const user = { _id: nextId("user"), userId: `U-${seq}`, username, email, role: "user" };
  users.push(user);
  res.status(201).json(user);
});

app.post("/u/login", (req, res) => {
  const { email } = req.body || {};
  const user = users.find((u) => u.email === email) || users[0];
  res.status(200).json({ token: "stub.jwt.token", user });
});

app.get("/u/me", (_req, res) => res.status(200).json(users[0]));

// ---- Root -----------------------------------------------------------------
app.get("/", (_req, res) => res.send("WELCOME (sample/stub server — no database)"));

app.listen(PORT, () => {
  console.log(`Sample bookstore server (stub data, no DB) running on http://localhost:${PORT}/`);
});

module.exports = app;
