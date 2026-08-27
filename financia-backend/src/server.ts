import app from './api/app';

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 Backend do Financia rodando na porta ${PORT}`);
});