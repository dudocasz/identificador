document.addEventListener('DOMContentLoaded', () => {
  // ======================
  // 🔹 MENU HAMBURGUER 🔹
  // ======================
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobile-menu");
  const header = document.querySelector("header");

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      mobileMenu.classList.toggle("show");
    });

    // Fecha o menu se clicar fora
    document.addEventListener("click", (e) => {
      if (!header.contains(e.target) && mobileMenu.classList.contains("show")) {
        hamburger.classList.remove("active");
        mobileMenu.classList.remove("show");
      }
    });
  }

  // ======================
  // 🔹 IDENTIFICADOR DE PANC 🔹
  // ======================
  const MODEL_PATH = 'tm-my-image-model/';
  let model;
  let videoStream;
  const webcamContainer = document.getElementById('webcam-container');
  const resultEl = document.getElementById('result');

  const infos = {
    "taioba": {
      nome: "Taioba (Xanthosoma sagittifolium)",
      desc: "Folhas ricas em ferro e vitaminas. Muito usada refogada ou em tortas.",
      curios: "Só deve ser consumida cozida, pois crua pode conter oxalato de cálcio.",
    },
    "peixinho": {
      nome: "Peixinho-da-horta (Stachys byzantina)",
      desc: "Folhas aveludadas, usadas empanadas ou fritas, lembrando peixe.",
      curios: "É uma planta ornamental e comestível, com textura macia e sabor leve.",
    },
    "dente de leao": {
      nome: "Dente-de-leão (Taraxacum officinale)",
      desc: "Folhas e flores comestíveis, com sabor levemente amargo.",
      curios: "Usado em chás e saladas, ajuda na digestão e é diurético natural.",
    }
  };

  async function init() {
    if (!resultEl) return;
    resultEl.innerHTML = "<p>Carregando modelo, aguarde...</p>";
    try {
      const modelURL = MODEL_PATH + 'model.json';
      const metadataURL = MODEL_PATH + 'metadata.json';
      model = await tmImage.load(modelURL, metadataURL);
      resultEl.innerHTML = "<p style='color:green'>Modelo carregado com sucesso!</p>";
      console.log("Modelo carregado com sucesso");
    } catch (err) {
      console.error("Erro ao carregar modelo:", err);
      resultEl.innerHTML = `<p style="color:red">Erro ao carregar modelo. Verifique o caminho da pasta 'tm-my-image-model'.</p>`;
    }
  }
  init();

  async function startWebcam(facingMode = "user") {
    if (!model) {
      resultEl.innerHTML = "<p style='color:red'>O modelo ainda não foi carregado.</p>";
      return;
    }

    try {
      // Para qualquer câmera anterior
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }

      // Ajusta constraints para celular
      const constraints = {
        video: {
          width: { ideal: 480 },
          height: { ideal: 360 },
          facingMode: { exact: facingMode } // "user" ou "environment"
        },
        audio: false
      };

      videoStream = await navigator.mediaDevices.getUserMedia(constraints);

      const video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      video.srcObject = videoStream;
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';

      webcamContainer.innerHTML = '';
      webcamContainer.appendChild(video);

      // Habilita/desabilita botões
      document.getElementById('stop-webcam').disabled = false;
      document.getElementById('capture').disabled = false;
      document.getElementById('start-webcam-front').disabled = true;
      document.getElementById('start-webcam-back').disabled = true;

      window.videoElement = video;

    } catch (err) {
      console.error(err);
      resultEl.innerHTML = `<p style="color:red">Não foi possível acessar a câmera. Verifique permissões e HTTPS.</p>`;
    }
  }

  // ======================
  // 🔹 CONTROLES
  // ======================
  const startFrontBtn = document.getElementById('start-webcam-front');
  const startBackBtn = document.getElementById('start-webcam-back');
  const stopBtn = document.getElementById('stop-webcam');
  const captureBtn = document.getElementById('capture');
  const uploadInput = document.getElementById('upload');

  startFrontBtn.addEventListener('click', () => startWebcam('user'));
  startBackBtn.addEventListener('click', () => startWebcam('environment'));

  stopBtn.addEventListener('click', () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      videoStream = null;
      webcamContainer.innerHTML = 'Câmera desligada';
      stopBtn.disabled = true;
      captureBtn.disabled = true;
      startFrontBtn.disabled = false;
      startBackBtn.disabled = false;
    }
  });

  captureBtn.addEventListener('click', async () => {
    if (!videoStream || !model) {
      resultEl.innerHTML = "<p style='color:red'>Inicie a câmera e aguarde o carregamento do modelo.</p>";
      return;
    }

    const video = window.videoElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const predictions = await model.predict(canvas);
    showPredictions(predictions);
  });

  if (uploadInput) {
    uploadInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file || !model) {
        resultEl.innerHTML = "<p style='color:red'>Selecione uma imagem e aguarde o carregamento do modelo.</p>";
        return;
      }

      const img = document.createElement('img');
      img.classList.add('preview');
      img.src = URL.createObjectURL(file);
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '10px';

      img.onload = async () => {
        webcamContainer.innerHTML = '';
        webcamContainer.appendChild(img);
        const predictions = await model.predict(img);
        showPredictions(predictions);
        URL.revokeObjectURL(img.src);
      };
    });
  }

  function showPredictions(predictions) {
    predictions.sort((a, b) => b.probability - a.probability);
    const top = predictions[0];
    const nome = top.className.toLowerCase().trim();
    resultEl.innerHTML = '';

    if (infos[nome]) {
      const info = infos[nome];
      resultEl.innerHTML = `
        <h3>${info.nome}</h3>
        <p><strong>Precisão:</strong> ${(top.probability * 100).toFixed(1)}%</p>
        <p>${info.desc}</p>
        <p><em>${info.curios}</em></p>
      `;
    } else {
      resultEl.innerHTML = `
        <h3>Não foi possível identificar a PANC</h3>
        <p>Tente enviar outra imagem mais clara e com fundo neutro.</p>
      `;
    }

    const list = predictions.slice(0, 3).map(p =>
      `<li>${p.className}: ${(p.probability * 100).toFixed(1)}%</li>`
    ).join("");
    resultEl.innerHTML += `<ul style="margin-top:10px;text-align:center;">${list}</ul>`;
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && videoStream && model) {
      captureBtn.click();
    }
  });

  // ======================
  // 🔹 REGISTRAR SERVICE WORKER (PWA) 🔹
  // ======================
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(() => console.log('✅ Service Worker registrado com sucesso!'))
      .catch(err => console.log('❌ Falha ao registrar Service Worker:', err));
  }
});