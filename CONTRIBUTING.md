# Como contribuir com o THATA Catalog

Contribuições para navegação, acessibilidade, documentação e qualidade dos dados são bem-vindas. Antes de implementar uma mudança grande, abra uma issue explicando o problema e a solução proposta.

## Preparar o projeto

1. Crie um fork e clone sua cópia do repositório.
2. Instale as dependências com `npm install`.
3. Inicie o ambiente local com `npm run dev` e abra o endereço indicado no terminal.
4. Crie uma branch para uma única melhoria.

Não publique tokens, senhas, arquivos de ambiente ou dados de clientes. Se a execução depender de uma configuração não documentada, descreva a variável necessária sem divulgar seu valor.

## Relatar um problema

Inclua na issue:

- passos mínimos para reproduzir;
- resultado esperado e resultado observado;
- navegador e tamanho aproximado da tela;
- nome ou código da joia, quando o problema envolver um produto;
- captura de tela sem informações pessoais, se ajudar.

Problemas de imagens devem identificar a peça exata. Produtos parecidos podem ter materiais, tamanhos e acabamentos diferentes.

## Validar uma alteração

Para mudanças de código, execute `npm run build`. Quando alterar a interface, confira no celular e no desktop:

- busca com e sem acentos;
- combinação de filtros e navegação entre páginas;
- inclusão e remoção de peças da seleção;
- mensagem gerada para o WhatsApp, sem enviá-la durante o teste;
- navegação por teclado e foco visível;
- comportamento quando uma imagem não carrega.

Em alterações apenas de documentação, revise a formatação, os links e a correspondência das instruções com os scripts disponíveis em `package.json`.

## Enviar um pull request

Descreva o problema, o que mudou e como você verificou o resultado. Acrescente imagens de antes e depois quando houver uma mudança visual. Informe limitações e verificações que não conseguiu executar.

Mantenha cada PR concentrado em uma melhoria. Registre coautoria apenas quando outra pessoa realmente tiver participado da contribuição.
