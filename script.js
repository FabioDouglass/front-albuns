//vetores para salvar lista de albuns retornados pela api
let albunsBuscados = [];
let albunsAvaliados = [];
let indiceAtual = 0;
let abaAtual = "buscar";

//controlador de íncide atual
function abrirDetalhesPorIndice(indice) {
  indiceAtual = indice;
  if (abaAtual === "buscar") {
    abrirDetalhes(albunsBuscados[indiceAtual].collectionId);
  } else {
    abrirDetalhes(albunsAvaliados[indiceAtual].collectionId);
  }
}
function proximoAlbum() {
  let vetor = abaAtual === "buscar" ? albunsBuscados : albunsAvaliados;
  if (indiceAtual < vetor.length - 1) {
    indiceAtual++;
    abrirDetalhesPorIndice(indiceAtual);
  }
}

function anteriorAlbum() {
  if (indiceAtual > 0) {
    indiceAtual--;
    abrirDetalhesPorIndice(indiceAtual);
  }
}

function buscarAlbuns() {
  albunsBuscados = [];
  indiceAtual = 0;
  const artistaInput = document.getElementById("artista").value;
  if (!artistaInput) return alert("Digite o nome do artista");

  // Substituir espaços por +
  const artista = encodeURIComponent(
    document.getElementById("artista").value.trim().replace(/\s+/g, "+")
  );

  const url = `https://itunes.apple.com/search?term=${artista}&entity=album`;

  fetch(url)
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`Erro HTTP ${res.status}`);
      }
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error("Resposta não é JSON válido");
      }
    })
    .then((data) => {
      const resultados = Array.isArray(data.results) ? data.results : [];
      if (
        !data.results ||
        !Array.isArray(data.results) ||
        data.results.length === 0
      ) {
        alert("Nenhum álbum encontrado.");
        return;
      }

      const container = document.getElementById("albuns-container");
      container.innerHTML = "";

      const albunsOrdenados = resultados.sort(
        (a, b) => new Date(b.releaseDate) - new Date(a.releaseDate)
      );
      albunsBuscados = albunsOrdenados;

      albunsOrdenados.forEach((album) => {
        const div = document.createElement("div");
        div.className = "album-card";
        div.innerHTML = `
      <img src="${album.artworkUrl100}" alt="${album.collectionName}">
      <p>${album.collectionName}, ${album.releaseDate.split("-")[0]}</p>
      <p>${album.artistName}</p>
    `;
        div.onclick = () => abrirDetalhes(album.collectionId);
        container.appendChild(div);
      });
    })
    .catch((err) => {
      console.error("Erro ao buscar álbuns:", err);
      alert("Ocorreu um erro ao buscar os álbuns. Tente novamente.");
    });
}

let albumAtual = null;

function abrirDetalhes(collectionId) {
  let vetorAtual = abaAtual === "buscar" ? albunsBuscados : albunsAvaliados;
  const index = vetorAtual.findIndex((a) => a.collectionId === collectionId);
  if (index !== -1) {
    indiceAtual = index;
  }
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
      document.getElementById(
        "data-lancamento"
      ).textContent = `Lançamento: ${album.releaseDate
        .split("T")[0]
        .split("-")
        .reverse()
        .join("/")}`;

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
      // limpar caixa de texto
      const comentario = document.querySelector(".review textarea");
      const comentarioExistente = document.getElementById("comentario-exibido");
      if (comentarioExistente) comentarioExistente.style.display = "none";

      const notaElem = document.getElementById("nota-album");
      const radiosDiv = document.getElementById("notas");
      const btnRegistrar = document.getElementById("btn-registrar");
      const btnEditar = document.getElementById("btn-editar");
      const btnApagar = document.getElementById("btn-apagar");

      // verificar se nota já está registrada
      fetch(`http://127.0.0.1:5000/album?collectionId=${collectionId}`)
        .then((res) => res.json())
        .then((dados) => {
          if (dados.length > 0) {
            // album já avaliado
            notaElem.innerHTML = `${dados[0].nota} &#x2605;`;
            radiosDiv.style.display = "none";
            btnRegistrar.style.display = "none";
            btnApagar.style.display = "inline-block";
            btnEditar.style.display = "inline-block";

            if (dados[0].critica && dados[0].critica.trim() !== "") {
              comentario.style.display = "none";

              let comentarioExistente =
                document.getElementById("comentario-exibido");
              if (!comentarioExistente) {
                comentarioExistente = document.createElement("p");
                comentarioExistente.id = "comentario-exibido";
                comentarioExistente.className = "comentario-exibido";
                comentario.parentNode.appendChild(comentarioExistente);
              }
              comentarioExistente.textContent = dados[0].critica;
              comentarioExistente.style.display = "block";
            } else {
              comentario.style.display = "none";
              if (comentarioExistente)
                comentarioExistente.style.display = "none";
            }
          } else {
            // Álbum não avaliado
            notaElem.innerHTML = "";
            radiosDiv.style.display = "block";
            btnRegistrar.style.display = "inline-block";
            btnApagar.style.display = "none";
            btnEditar.style.display = "none";

            // Mostrar textarea para digitar comentário
            comentario.style.display = "block";
            comentario.value = "";
            if (comentarioExistente) comentarioExistente.style.display = "none";
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

  const comentarioElem = document.querySelector(".review textarea");
  const comentario = comentarioElem ? comentarioElem.value.trim() : "";

  const payload = {
    nome: albumAtual.collectionName,
    artista: albumAtual.artistName,
    ano: parseInt(albumAtual.releaseDate.split("-")[0]),
    nota: parseInt(notaSelecionada),
    collectionId: albumAtual.collectionId,
    critica: comentario,
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

function apagarAlbum() {
  if (!albumAtual) return;

  fetch(`http://127.0.0.1:5000/album/${albumAtual.collectionId}`, {
    method: "DELETE",
  })
    .then((res) => {
      if (res.ok) {
        alert("Álbum deletado com sucesso!");
        fecharDetalhes();
        listarAlbunsAvaliados();
      } else {
        alert("Erro ao registrar álbum");
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Erro na requisição");
    });
}

function editarAlbum() {
  if (!albumAtual) return;

  const notaElem = document.getElementById("nota-album");
  const comentarioExistente = document.getElementById("comentario-exibido");
  const btnEditar = document.getElementById("btn-editar");
  const btnApagar = document.getElementById("btn-apagar");

  notaElem.innerHTML = "";
  if (comentarioExistente) comentarioExistente.style.display = "none";
  btnEditar.style.display = "none";
  btnApagar.style.display = "none";

  const radiosDiv = document.getElementById("notas");
  const comentario = document.querySelector(".review textarea");

  radiosDiv.style.display = "block";
  comentario.style.display = "block";
  comentario.value = "";

  // Remove botão salvar antigo, se existir
  const btnSalvarExistente = document.getElementById("btn-salvar");
  if (btnSalvarExistente) btnSalvarExistente.remove();

  // Cria botão Salvar
  const btnSalvar = document.createElement("button");
  btnSalvar.id = "btn-salvar";
  btnSalvar.className = "btn-salvar";
  btnSalvar.textContent = "Salvar";

  // Ao clicar, lê a nota e o comentário dinamicamente
  btnSalvar.onclick = () => {
    let notaSelecionada = null;
    const radios = document.getElementsByName("nota");
    radios.forEach((r) => {
      if (r.checked) notaSelecionada = r.value;
    });

    const comentarioElem = document.querySelector(".review textarea");
    const textoCritica = comentarioElem ? comentarioElem.value.trim() : null;

    const btnSalvarExistente = document.getElementById("btn-salvar");
    if (btnSalvarExistente) btnSalvarExistente.remove();

    salvarAlbum(notaSelecionada, textoCritica);
  };

  // Adiciona o botão ao DOM
  const reviewDiv = document.querySelector(".review");
  reviewDiv.appendChild(btnSalvar);
}

function salvarAlbum(notaSelecionada, textoCritica) {
  if (!albumAtual || !notaSelecionada) return;

  fetch(`http://127.0.0.1:5000/album/${albumAtual.collectionId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nota: notaSelecionada,
      critica: textoCritica || null,
    }),
  })
    .then((res) => {
      if (res.ok) {
        alert("Álbum atualizado com sucesso!");
        fecharDetalhes();
        listarAlbunsAvaliados();
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
  document
    .querySelectorAll(".aba")
    .forEach((aba) => (aba.style.display = "none"));
  document.getElementById(nomeAba).style.display = "block";

  abaAtual = nomeAba;

  if (nomeAba === "avaliados") {
    listarAlbunsAvaliados();
  }
}

function listarAlbunsAvaliados() {
  albunsAvaliados = [];
  indiceAtual = 0;
  fetch("http://127.0.0.1:5000/albuns")
    .then((res) => res.json())
    .then((data) => {
      const container = document.getElementById("albuns-avaliados-container");
      container.innerHTML = "";

      if (!data.length) {
        container.innerHTML = "<p>Nenhum álbum avaliado ainda.</p>";
        return;
      }
      albunsAvaliados = data;
      data.forEach((album) => {
        const div = document.createElement("div");
        div.className = "album-card";
        div.innerHTML = `
          <img src="" alt="${album.nome}">
          <p>${album.nome}, ${album.ano}</p>
          <p>${album.artista}</p>
          <p>Nota: ${album.nota} &#x2605;</p>
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
