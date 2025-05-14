# Guia de Gerenciamento da Base de Conhecimento da LUZ IA

Este documento contém instruções detalhadas sobre como adicionar, atualizar e remover conhecimento da base de dados usada pela LUZ IA para responder perguntas. O sistema utiliza RAG (Retrieval Augmented Generation) que combina recuperação de documentos relevantes com geração de texto para produzir respostas mais precisas e contextuais.

## Estrutura do Sistema

- **Pasta `/documents`**: Contém todos os arquivos de texto/markdown que formam a base de conhecimento.
- **Pasta `/data/vectorstore`**: Armazena o vector store com embeddings dos documentos processados.
- **Script `/src/scripts/ingest-documents.js`**: Processa os documentos, gera embeddings e atualiza o vector store.

## Adicionando Novo Conhecimento

Para adicionar novos conteúdos à base de conhecimento da LUZ IA:

1. **Prepare o documento**:
   - Crie um arquivo `.md` (markdown) ou `.txt` (texto).
   - Estruture o conteúdo com títulos, subtítulos e parágrafos claros.
   - Use formatação markdown para melhorar a legibilidade.
   - Inclua apenas conteúdo relevante e factual sobre o curso "Jornada Mente Merecedora".

2. **Salve o documento na pasta correta**:
   ```bash
   cp seu-arquivo.md /home/m/luz.ia_v5/documents/
   ```

3. **Execute o script de ingestão**:
   ```bash
   cd /home/m/luz.ia_v5
   node src/scripts/ingest-documents.js
   ```

4. **Verifique o resultado**:
   - O script mostrará quantos documentos foram carregados e processados.
   - Confirmará quando o vector store for atualizado com sucesso.

## Atualizando Conhecimento Existente

Para atualizar informações que já estão na base de conhecimento:

1. **Edite o arquivo existente**:
   - Localize o arquivo na pasta `/documents`.
   - Modifique o conteúdo conforme necessário.

2. **Ou substitua o arquivo inteiro**:
   ```bash
   cp arquivo-atualizado.md /home/m/luz.ia_v5/documents/arquivo-existente.md
   ```

3. **Execute o script de ingestão novamente**:
   ```bash
   cd /home/m/luz.ia_v5
   node src/scripts/ingest-documents.js
   ```

O script identificará automaticamente as mudanças e atualizará o vector store.

## Removendo Conhecimento

Para remover informações da base de conhecimento:

1. **Remova o arquivo correspondente**:
   ```bash
   rm /home/m/luz.ia_v5/documents/arquivo-para-remover.md
   ```

2. **Reconstrua todo o vector store**:
   ```bash
   # Remova o vector store existente
   rm -rf /home/m/luz.ia_v5/data/vectorstore/*
   
   # Execute o script para recriar o vector store com os arquivos restantes
   cd /home/m/luz.ia_v5
   node src/scripts/ingest-documents.js
   ```

## Reconstruindo a Base de Conhecimento Completa

Se necessário, você pode reconstruir completamente a base de conhecimento:

1. **Limpe o vector store existente**:
   ```bash
   rm -rf /home/m/luz.ia_v5/data/vectorstore/*
   ```

2. **Opcional: limpe todos os documentos**:
   ```bash
   # CUIDADO: isso removerá todos os documentos existentes
   rm -f /home/m/luz.ia_v5/documents/*
   ```

3. **Adicione os novos documentos** na pasta `/documents`.

4. **Execute o script de ingestão**:
   ```bash
   cd /home/m/luz.ia_v5
   node src/scripts/ingest-documents.js
   ```

## Boas Práticas para Documentos

Para obter melhores resultados com o sistema RAG:

1. **Divida informações em tópicos claros**: Use cabeçalhos para separar diferentes conceitos.

2. **Mantenha um documento por tema principal**: Por exemplo, um documento sobre meditação, outro sobre afirmações, etc.

3. **Use linguagem clara e direta**: Evite ambiguidades ou jargões muito técnicos.

4. **Inclua exemplos práticos**: Exemplos concretos ajudam a IA a fornecer respostas mais úteis.

5. **Atualize regularmente**: Mantenha os documentos atualizados com as informações mais recentes do curso.

6. **Tamanho adequado**: Prefira vários documentos menores e focados em vez de um único documento muito extenso.

## Teste do Conhecimento Adicionado

Após adicionar ou modificar documentos, é recomendável testar se a IA está respondendo corretamente:

1. Acesse o chat da LUZ IA (`/luz_ia` no navegador).
2. Faça perguntas específicas sobre o conteúdo que você adicionou ou modificou.
3. Verifique se as respostas são precisas e relevantes.

## Resolução de Problemas

Se encontrar problemas ao atualizar a base de conhecimento:

1. **Verifique o formato dos documentos**:
   - Certifique-se de que estão em formato `.md` ou `.txt`.
   - Verifique se não há caracteres especiais problemáticos.

2. **Verifique as dependências**:
   ```bash
   cd /home/m/luz.ia_v5
   npm install @langchain/openai @langchain/textsplitters @langchain/core @langchain/community hnswlib-node
   ```

3. **Verifique as variáveis de ambiente**:
   - Confirme que `OPENAI_API_KEY` está definida no arquivo `.env`.

4. **Logs de erro**:
   - Analise os logs de erro ao executar o script de ingestão.
   - Procure por mensagens específicas que indiquem o problema.

5. **Reconstrua do zero**:
   - Se tudo mais falhar, reconstrua a base de conhecimento conforme descrito na seção anterior.

## Limitações Atuais

- O sistema processa apenas arquivos `.md` e `.txt`.
- Arquivos muito grandes podem ser divididos em chunks que podem perder algum contexto entre seções.
- A qualidade das respostas depende da qualidade e cobertura dos documentos fornecidos.
- Informações contraditórias em diferentes documentos podem confundir a IA.
