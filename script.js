function buscarAlbuns() {
  const artista = document.getElementById("artista").value;
  if (!artista) return alert("Digite o nome do artista");

  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    artista
  )}&entity=album`;

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      const container = document.getElementById("albuns-container");
      container.innerHTML = "";

      const albunsOrdenados = data.results.sort((a, b) => {
        return new Date(b.releaseDate) - new Date(a.releaseDate);
      });

      albunsOrdenados.forEach((album) => {
        const div = document.createElement("div");
        div.className = "album-card";
        div.innerHTML = `
          <img src="${album.artworkUrl100}" alt="${album.collectionName}">
          <p>${album.collectionName}</p>
          <p>${album.artistName}</p>
        `;
        div.onclick = () => abrirDetalhes(album.collectionId);
        container.appendChild(div);
      });
    });
}

let albumAtual = null;

function abrirDetalhes(collectionId) {
  const url = `https://itunes.apple.com/lookup?id=${collectionId}&entity=song`;
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      const album = data.results[0];
      const faixas = data.results.slice(1);

      albumAtual = album;

      // Exibe dados do álbum
      document.getElementById("capa-album").src = album.artworkUrl100.replace(
        "100x100",
        "300x300"
      );
      document.getElementById("nome-album").textContent = album.collectionName;
      document.getElementById("nome-artista").textContent = album.artistName;
      document.getElementById("data-lancamento").textContent = `Lançamento: ${
        album.releaseDate.split("T")[0]
      }`;

      // Exibe faixas
      const ul = document.getElementById("faixas");
      ul.innerHTML = "";
      faixas.forEach((f) => {
        const li = document.createElement("li");
        li.textContent = `${f.trackName}`;
        ul.appendChild(li);
      });

      const radios = document.getElementsByName("nota");
      radios.forEach((r) => (r.checked = false));
      const notaElem = document.getElementById("nota-album");
      const radiosDiv = document.getElementById("notas");
      // ✅ Verifica se o álbum já está registrado no banco
      fetch(`http://127.0.0.1:5000/album?collectionId=${collectionId}`)
        .then((res) => res.json())
        .then((dados) => {
          if (dados.length > 0) {
            // Se já existe, exibe a nota e esconde os radios
            notaElem.textContent = `${dados[0].nota}`;
            radiosDiv.style.display = "none";
          } else {
            // Se não existe, limpa o texto e mostra os radios
            notaElem.textContent = "";
            radiosDiv.style.display = "block";
          }
        });

      document.getElementById("album-detalhes").style.display = "flex";
    });
}

function registrarAlbum() {
  if (!albumAtual) return;

  const radios = document.getElementsByName("nota");
  let notaSelecionada = null;
  radios.forEach((r) => {
    if (r.checked) notaSelecionada = r.value;
  });

  if (!notaSelecionada) return alert("Selecione uma nota para o álbum");

  const payload = {
    nome: albumAtual.collectionName,
    artista: albumAtual.artistName,
    ano: parseInt(albumAtual.releaseDate.split("-")[0]),
    nota: parseInt(notaSelecionada),
    collectionId: albumAtual.collectionId,
  };

  fetch("http://127.0.0.1:5000/album", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) => {
      if (res.ok) {
        alert("Álbum registrado com sucesso!");
        fecharDetalhes();
      } else {
        alert("Erro ao registrar álbum");
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Erro na requisição");
    });
}

function fecharDetalhes() {
  document.getElementById("album-detalhes").style.display = "none";
  albumAtual = null;
}

function abrirAba(nomeAba) {
  document.querySelectorAll(".aba").forEach((aba) => {
    aba.style.display = "none";
  });
  document.getElementById(nomeAba).style.display = "block";

  if (nomeAba === "avaliados") {
    listarAlbunsAvaliados();
  }
}

function listarAlbunsAvaliados() {
  fetch("http://127.0.0.1:5000/albuns")
    .then((res) => res.json())
    .then((data) => {
      const container = document.getElementById("albuns-avaliados-container");
      container.innerHTML = "";

      if (!data.length) {
        container.innerHTML = "<p>Nenhum álbum avaliado ainda.</p>";
        return;
      }

      data.forEach((album) => {
        const div = document.createElement("div");
        div.className = "album-card";
        div.innerHTML = `
          <img src="" alt="${album.nome}">
          <p>${album.nome}, ${album.ano}</p>
          <p>${album.artista}</p>
          <p>Nota: ${album.nota}</p>
        `;

        div.onclick = () => abrirDetalhes(album.collectionId);
        container.appendChild(div);

        fetch(
          `https://itunes.apple.com/lookup?id=${album.collectionId}&entity=album`
        )
          .then((res) => res.json())
          .then((resData) => {
            if (resData.results && resData.results[0]) {
              const img = div.querySelector("img");
              img.src = resData.results[0].artworkUrl100;
            }
          })
          .catch(() => {
            console.warn("Não foi possível carregar capa do álbum no iTunes.");
          });
      });
    })
    .catch((error) => {
      console.error("Erro ao buscar álbuns avaliados:", error);
      const container = document.getElementById("albuns-avaliados-container");
      container.innerHTML =
        "<p>Não foi possível carregar os álbuns avaliados.</p>";
    });
}

listarAlbunsAvaliados();
