const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = 3000;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "file/");
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(6, (err, raw) => {
      if (err) return cb(err);
      cb(null, raw.toString("hex") + path.extname(file.originalname));
    });
  },
});

const upload = multer({ storage: storage });

app.use(express.static("public"));
app.use("/file", express.static(path.join(__dirname, "file")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/privacy-policy", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "privacy.html"));
});

app.post("/upload", upload.single("file"), (req, res) => {
  const fileName = req.file.filename;
  const fileUrl = `http://${req.hostname}/file/${fileName}`;
  const downloadUrl = `http://${req.hostname}/download/${fileName}`;
  const deleteUrl = `http://${req.hostname}/delete/${fileName}`;

  const fileDetails = {
    fileName: fileName,
    originalName: req.file.originalname,
    size: req.file.size,
    extension: path.extname(req.file.originalname),
    uploadTime: new Date().toISOString(),
  };

  const responseData = {
    fileDetails: fileDetails,
    fileUrl: fileUrl,
    downloadUrl: downloadUrl,
    deleteUrl: deleteUrl,
    message: "File uploaded successfully",
  };
  res.json(responseData);
});

app.get("/download/:fileName", (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, "file", fileName);

  if (fs.existsSync(filePath)) {
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        res.status(500).send("Error downloading file");
      }
    });
  } else {
    res.status(404).send("File not found");
  }
});

app.delete("/delete/:fileName", (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, "file", fileName);

  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
        res.status(500).send("Error deleting file");
        return;
      }
      res.send("File deleted successfully");
    });
  } else {
    res.status(404).send("File not found");
  }
});

var options = {
  customSiteTitle: "AGT Uploader",
  customfavIcon: "https://www.agatshortid.my.id/D4PcTnHni",
  customCss: `.topbar { display: none; }`,
  swaggerOptions: {
    displayRequestDuration: true,
  },
};

const swaggerDocument = {
  swagger: "2.0",
  info: {
    version: "1.0.0",
    title: "Uploader Docs",
    description: "Dokumentasi untuk Uploader",
    "x-logo": {
      url: "https://www.agatshortid.my.id/D4PcTnHni",
      altText: "AGT Upload",
    },
  },
  host: "uploaderagt.my.id",
  basePath: "/",
  tags: [{ name: "Upload", description: "Endpoint terkait upload file" }],
  paths: {
    "/upload": {
      post: {
        tags: ["Upload"],
        summary: "Unggah file",
        consumes: ["multipart/form-data"],
        parameters: [
          {
            in: "formData",
            name: "file",
            type: "file",
            description: "File yang akan diunggah",
          },
        ],
        responses: {
          200: {
            description: "File berhasil diunggah",
            schema: {
              type: "object",
              properties: {
                fileName: {
                  type: "string",
                  description: "Nama file yang diunggah",
                },
                fileUrl: {
                  type: "string",
                  description: "URL file yang diunggah",
                },
                message: {
                  type: "string",
                  description: "Pesan kesuksesan",
                },
              },
            },
          },
        },
      },
    },
    "/download/{fileName}": {
      get: {
        tags: ["Upload"],
        summary: "Unduh file",
        parameters: [
          {
            in: "path",
            name: "fileName",
            type: "string",
            required: true,
            description: "Nama file yang akan diunduh",
          },
        ],
        responses: {
          200: {
            description: "File berhasil diunduh",
            schema: {
              type: "file",
            },
          },
          404: {
            description: "File tidak ditemukan",
          },
        },
      },
    },
    "/delete/{fileName}": {
      delete: {
        tags: ["Upload"],
        summary: "Hapus file",
        parameters: [
          {
            in: "path",
            name: "fileName",
            type: "string",
            required: true,
            description: "Nama file yang akan dihapus",
          },
        ],
        responses: {
          200: {
            description: "File berhasil dihapus",
          },
          404: {
            description: "File tidak ditemukan",
          },
        },
      },
    },
  },
  "x-request-time": new Date().toISOString(),
};

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, options),
);

app.listen(port, () => {
  console.log(`Server sedang mendengarkan di http://localhost:${port}`);
});
