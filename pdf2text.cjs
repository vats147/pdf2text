const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const cluster = require('cluster');
const os = require('os');

const app = express();
const upload = multer({ dest: 'uploads/' });

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  console.log(`Master ${process.pid} is running`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  app.post('/pdf', upload.single('pdf'), async (req, res) => {
    const pdfBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(pdfBuffer);
    res.json(data.text);
  });

  app.listen(3000 + cluster.worker.id, () => {
    console.log(`Worker ${cluster.worker.id} running on port ${3000 + cluster.worker.id}`);
  });
}
