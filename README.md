# Frontend Acervo Filmes

Frontend para a apicação api-filmes, para gerenciar filmes.

## Baixar o projeto

```bash
git clone https://github.com/FabioDouglass/front-filmes
cd front-filmes
```

## Rodar o Projeto

**1 - Construir a imagem Docker do projeto**

```
docker build -t front-filmes .

```

**2 - Iniciar o projeto**

```
docker run -p 8080:80 front-filmes

```

## Fluxograma da Arquitetura da serviço

---

![alt text](Fluxograma.png)
