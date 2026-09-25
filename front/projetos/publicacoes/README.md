# Publicações de projetos

Adicione nesta pasta um arquivo `.json` por nova publicação. A GitHub Action valida o arquivo, calcula `end_date` como `start_date` mais seis meses, adiciona o resultado em `front/projetos/projetos.json` e faz commit na branch da PR.

Formato de entrada:

```json
{
  "image": "projeto.png",
  "description": "Descrição do projeto.",
  "title": "Nome do projeto",
  "start_date": "2026/09/25"
}
```

A data deve usar o formato `YYYY/MM/DD`. O campo `end_date` não deve ser informado na publicação; ele será adicionado automaticamente pela Action.
