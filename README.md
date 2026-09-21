# Academia Valley

Um jogo de exploração, cultivo e filosofia em PT-BR. Pixel art original desenhada em canvas, sem imagens externas, backend, npm, build ou dependências JavaScript.

## Comece pelo MVP

Na abertura, escolha **Novo jogo · MVP**. Essa modalidade tem Platão e Aristóteles como personagens ativos, 15 perguntas, mapa, horta, mercado, melhorias, ciclo diário e salvamento.

Para concluir:

1. Vá à Academia, no noroeste, e acerte três perguntas diferentes de Platão.
2. Vá ao Liceu, no nordeste, e acerte três perguntas diferentes de Aristóteles.
3. Colha três azeitonas e duas ervas a oeste da ágora. Regue cada erva antes de colher.
4. Entregue a encomenda no marco do mercado, no centro da vila.
5. Abra o diário e ative a jornada completa sem perder o progresso.

Perguntas de contexto estão também com Platão; comparações, com Aristóteles. Cada professor permite escolher entre os níveis disponíveis. Mudar de nível ajuda a descobrir perguntas inéditas.

## Expansão incluída

A jornada completa pode ser iniciada diretamente na abertura ou ativada pelo diário/menu:

- 40 perguntas com quatro alternativas embaralhadas e três dificuldades.
- Platão, Aristóteles, memória de Sócrates, Alexandre jovem, Dâmon e Íris.
- Caverna de Platão: três etapas guiadas, das sombras ao Bem.
- Coleção do Liceu: arraste os itens ou toque na categoria adequada.
- Duelo de ideias: cinco rodadas de comparação entre Platão e Aristóteles.
- Missões de Íris, Alexandre e Sócrates, com recompensas únicas.
- Diário com conceitos desbloqueados, cronologia e conquistas.

Para a Coroa de Oliveira, complete o objetivo do MVP, os três minijogos e as missões dos colegas. Volte a Íris após dois acertos de comparações; a Alexandre após dois de contexto; e a Sócrates após acertar sua pergunta. O jogo continua após a conclusão. Os 40 acertos únicos rendem uma conquista adicional.

## Controles

| Ação | Computador | Celular |
| --- | --- | --- |
| Andar | WASD / setas | Joystick |
| Interagir | E / Enter | Interagir |
| Diário | J / botão Diário | Diário |
| Pausar | Esc / Pausar | Pausar |
| Responder | Clique ou Tab + Enter | Toque |
| Classificar | Clique ou arraste | Toque no destino |

Aproxime-se de um personagem, recurso ou marco. A indicação na tela mostra o alvo mais próximo. Botões e diálogos aceitam navegação por teclado; a exploração no canvas exige percepção visual.

## Ciclo, cultivo e economia

O dia vai das 6h às 22h e dura cerca de quatro minutos sem pausas. A primeira manhã começa às 8h. Conversas, diário e abas ocultas pausam o relógio. Às 22h, o estudante descansa em casa. A casa também permite avançar o dia voluntariamente.

Azeitonas e papiros podem ser coletados uma vez por dia por ponto. Ervas precisam ser regadas e depois colhidas. A cada terceiro dia chove e a rega é automática. Recursos se renovam na manhã seguinte: é uma simplificação lúdica, não uma simulação agronômica. Os papiros são recursos de jogo em uma costa imaginária, não uma afirmação sobre cultivo de papiro na Atenas histórica.

Azeitonas valem 4 dracmas; ervas, 3; papiros, 6. O cesto custa 45 dracmas e acrescenta um item por coleta. Sandálias custam 60 e aumentam a velocidade em 30%. A primeira encomenda rende 35 dracmas e 30 XP. Reserve seus itens antes de vender tudo; vender por engano não bloqueia o jogo, pois os recursos voltam no dia seguinte.

Acertos inéditos rendem 10, 20 ou 30 XP e 3, 6 ou 9 dracmas, conforme a dificuldade. Revisões corretas rendem 1 XP. Erros mostram explicação, não tiram recursos e permitem nova tentativa. Os conceitos entram no diário mesmo depois de uma resposta errada. Cada minijogo concede uma única recompensa de 60 XP e 25 dracmas. Fechar um minijogo reinicia sua sequência, mas preserva as respostas já aprendidas.

## Arquivos e arquitetura

- `index.html`: estrutura, canvas, controles e diálogo acessível por teclado.
- `style.css`: apresentação responsiva, paleta, controles e fonte opcional.
- `js/data/questions.js`: array de objetos JSON, exposto como `window.QUESTIONS`; índices corretos de 0 a 3. As primeiras 15 perguntas são o MVP.
- `js/data/npcs.js`: personagens e conceitos do diário.
- `js/game.js`: estado, validação do save, movimento, colisão, câmera, desenho, áudio, economia e minijogos.
- `README.md`: documentação, limites, fontes e publicação.

Scripts clássicos com `defer`, sem `fetch` ou módulos ES, permitem abrir diretamente o HTML. A fonte VT323 vem do Google Fonts quando disponível; o fallback local é `monospace`. O jogo funciona sem a fonte e sem rede. Sons são gerados pela Web Audio API após interação.

## Salvamento

O estado fica em `localStorage`, na chave `academia-valley-v1`, com gravação em ações relevantes, a cada cinco segundos, na ocultação da aba e na saída da página. O jogo retoma após escolher Continuar.

O progresso pertence ao navegador e à origem usados. Não sincroniza entre dispositivos nem migra automaticamente do arquivo local para o GitHub Pages. Limpar os dados do site apaga a partida. Em navegadores que bloqueiam armazenamento, a partida continua na aba, com aviso. Novo jogo pede confirmação antes de substituir o progresso. O mudo é uma preferência da sessão.

## Rigor histórico

A vila é uma composição fictícia. Sócrates morreu em 399 a.C.; a Academia é tradicionalmente datada de cerca de 387 a.C.; Platão morreu em 347 a.C.; a tutoria de Alexandre é situada em cerca de 343/342 a.C.; a escola aristotélica no Liceu, em cerca de 335 a.C. Assim, esses personagens e instituições não coexistiram da maneira encenada aqui.

Todas as falas são inventadas para ensinar, não citações. As ideias são apresentadas com qualificações: Platão não se reduz a uma doutrina uniforme; Aristóteles não dispensa o raciocínio em favor de observação pura; o meio-termo não é média aritmética. A associação entre o peripatos e ensinar caminhando não comprova que todas as aulas ocorressem em movimento. Detalhes da educação de Alexandre são incertos.

A classificação em plantas, animais, virtudes e vícios é um exercício moderno que junta investigações distintas, não uma tabela original de Aristóteles. O duelo compara ideias, sem declarar que um autor está sempre certo. As missões de Sócrates são memórias didáticas.

Leituras antigas de referência: Platão, **A República**, IV–VII; Aristóteles, **Ética a Nicômaco**, I–II, **Física**, II, e **Analíticos Anteriores**, I.

Referências acadêmicas consultadas:

- [Platão — Stanford Encyclopedia of Philosophy](https://plato.stanford.edu/entries/plato/): diálogos, Sócrates e Formas.
- [Ética e política em A República](https://plato.stanford.edu/entries/plato-ethics-politics/): justiça, alma e governo.
- [Aristóteles](https://plato.stanford.edu/entries/aristotle/): vida, escolas, lógica e filosofia.
- [Ética de Aristóteles](https://plato.stanford.edu/entries/aristotle-ethics/): hábito, virtude e meio-termo.
- [Aristóteles e as causas](https://plato.stanford.edu/entries/aristotle-causality/): quatro modos de explicação.
- [Biologia de Aristóteles](https://plato.stanford.edu/entries/aristotle-biology/): observação, comparação e explicação.

## Validação desta entrega

A sintaxe JavaScript e as regras do jogo foram verificadas por execução automatizada: banco de 40 perguntas, acesso aos pontos do mapa, colisões, respostas e recompensas, cultivo, economia, transição do MVP, três minijogos, missões, conclusão, retomada do save e manipuladores do joystick. O mapa também foi renderizado em Canvas 2D e inspecionado. Esses testes utilizaram uma simulação do DOM, não um navegador completo. O teste visual de layout, foco e toque em um navegador real permanece pendente neste ambiente.

## Próximas etapas

Os recursos que faltam ao MVP já estão disponíveis na jornada completa. Possíveis versões futuras, fora desta entrega: interiores exploráveis, rotinas de deslocamento dos NPCs, plantio por sementes com crescimento em vários dias e exportação/importação manual do save. Os três minijogos atuais usam diálogos e desafios curtos; a caverna não é um segundo mapa de exploração livre.

## Testar localmente

Extraia o ZIP e abra `index.html` em um navegador moderno. Nenhum comando é necessário. Se o navegador restringir o salvamento em arquivos locais, sirva a pasta com Python:

```bash
python -m http.server 8000
```

No Windows, também pode usar `py -m http.server 8000`. Abra `http://localhost:8000` no mesmo computador. Para testar no celular pela mesma rede, abra `http://IP-LOCAL-DO-PC:8000` e, se necessário, permita ao Python acesso à rede privada no firewall.

Confira: movimento e colisões; perguntas nos três níveis; erro sem perda; rega e colheita; entrega; compra; descanso; retomada do save; joystick; diário e minijogos. Use as ferramentas de desenvolvedor para conferir o console.

## Publicar no GitHub Pages

1. Crie um repositório público, por exemplo `academia-valley`.
2. Extraia o ZIP. Em **Add file > Upload files**, envie `index.html`, `style.css`, `README.md` e a pasta `js`, preservando `js/data`. Não envie só o ZIP nem uma pasta extra envolvendo o projeto.
3. Confirme os arquivos na branch `main`. O `index.html` deve estar na raiz.
4. Abra **Settings > Pages**.
5. Em **Build and deployment > Source**, selecione **Deploy from a branch**.
6. Selecione a branch **main**, a pasta **/(root)** e clique em **Save**.
7. Aguarde a publicação e abra o endereço exibido pelo GitHub. Normalmente será `https://SEU-USUARIO.github.io/academia-valley/`.
8. Para atualizar, substitua os arquivos e faça outro commit em `main`.

A hospedagem usa somente arquivos estáticos; não configure npm ou compilação. [Documentação oficial do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
