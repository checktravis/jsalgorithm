/**
 * Algorithm summary:
 * There will be a game tree representing a piece and its move action (node)
 */

class SoloChessBoard {

  constructor(numOfPieces) {
    this.numOfPieces = numOfPieces;
    this.board = this.getEmptyBoard();
  }

  /**
   * generate a game tree
   */
  generateGameTree(size, depth) {
    let nodes = [];

    //for all nodes, randomly find node that having level between [2,depth - 1] as parent
    for (let i = 0; i < size; i += 1) {
      let level;
      let parentId = null;
      //the first node in the tree must be at level 1
      if (i === 0) { //this is the root node
        level = 1;
      } else {
        //randomly select a node
        const selectedNode = nodes[Math.floor(Math.random() * nodes.length)];
        //now the first one is a random existing node
        //now we can randomly decide whether treat it as a parent node or sibling node
        let treatAsSibling = Math.round(Math.random());

        //this existing node is at the bottom of the tree
        //or has the parent node
        //we can only make it as a sibling node
        if (selectedNode.level === depth) {
          treatAsSibling = 1;
        }

        if (treatAsSibling && selectedNode.parentId) { //we can really treat it as a sibling node
          parentId = selectedNode.parentId;
          level = selectedNode.level;
        } else { //this is a parent node
          parentId = selectedNode.id;
          level = selectedNode.level + 1;
        }
        nodes[parentId].numOfChilds += 1;
      }

      const id = i;
      const node = {
        id: id,
        parentId: parentId,
        level: level,
        numOfChilds: 0
      };
      nodes.push(node);
    }

    return nodes;
  }

  getEmptyBoard() {
    return [
      ['-', '-', '-', '-', '-', '-', '-', '-'], //row 0
      ['-', '-', '-', '-', '-', '-', '-', '-'], //row 1
      ['-', '-', '-', '-', '-', '-', '-', '-'], //row 2
      ['-', '-', '-', '-', '-', '-', '-', '-'], //...
      ['-', '-', '-', '-', '-', '-', '-', '-'],
      ['-', '-', '-', '-', '-', '-', '-', '-'],
      ['-', '-', '-', '-', '-', '-', '-', '-'],
      ['-', '-', '-', '-', '-', '-', '-', '-']
    ];
  }

  /**
   * get available squares when placing a piece to a specific square
   */
  getAvailableSourceSquaresForPlacement(piece, square) {
    const row = square.row;
    const col = square.col;

    const squares = [];

    //use the target square as the origin, we will have the coordinates
    let coordinates;
    let affectedCoordinates = [];

    if (piece === PAWN) { //pawn can only move up
      coordinates = [
        [-1, 0]
      ];
    } else if (piece === BISHOP) { //bishop has 4 possible moves
      coordinates = [
        [2, 2], [2, -2], [-2, 2], [-2, -2]
      ];
      affectedCoordinates = [ //each move will affect one square in the diagonal
        [1, 1], [1, -1], [-1, 1], [-1, -1]
      ];
    } else if (piece === ROOK) { //root has 4 possible moves
      coordinates = [
        [0, 1], [0, -1], [-1, 0], [1, 0]
      ];
    } else if (piece === KING || piece === QUEEN) { //king and queen has 8 possible moves
      coordinates = [
        [0, 1], [1, 1], [1, 0], [1, -1],
        [0, -1], [-1, 1], [-1, 0], [-1, -1]
      ];
    } else if (piece === KNIGHT) { //knight has 8 possible moves
      coordinates = [
        [-1, 2], [-1, -2], [1, 2], [1, -2],
        [2, -1], [-2, -1], [2, 1], [-2, 1]
      ];
    }

    for (let ci = 0; ci < coordinates.length; ci += 1) {
      const coord = coordinates[ci];
      const r = row + coord[0];
      const c = col + coord[1];
      //make sure:
      //this coordinate is inside the board
      //this coordinate is not occupied yet
      //no pawn promotion
      //do not block a bishop
      let squareIsValid = false;
      const resultSquare = {};

      if ((r >= 0 && r <= 7) &&
        (c >= 0 && c <= 7) &&
        this.board[r][c] === '-' &&
        !(piece === PAWN && r < 2)) {
        if (affectedCoordinates.length > 0) {
          const affectedCoord = affectedCoordinates[ci];
          const ar = row + affectedCoord[0];
          const ac = col + affectedCoord[1];
          if (this.board[ar][ac] === '-') {
            resultSquare.affectedRow = ar;
            resultSquare.affectedCol = ac;
            squareIsValid = true;
          }
        } else {
          squareIsValid = true;
        }
      }

      if (squareIsValid) {
        resultSquare.row = r;
        resultSquare.col = c;
        squares.push(resultSquare);
      }
    }

    return squares;
  }

  /**
   * get path nodes of a specific node
   */
  getNodesInPathOf(node) {
    const nodes = [];
    let curNode = node;
    while (curNode.parentId) {
      nodes.unshift(this.gameTreeNodes[node.parentId]);
      curNode = this.gameTreeNodes[curNode.parentId];
    }
    //add the root node
    nodes.unshift(this.gameTreeNodes[0]);
    return nodes;
  }

  /**
   * get a random piece
   */
  getRandomPiece() {
    return this.availablePcs[Math.floor(Math.random() * this.availablePcs.length)];
  }

  addPieceOnSquare(piece, square) {
    this.board[square.row][square.col] = piece;
  }

  /**
   * generate the first piece in the board
   */
  generateFirstPiece() {
    const row = Math.floor(Math.random() * 8);
    const col = Math.floor(Math.random() * 8);
    const piece = this.getRandomPiece();
    this.firstOccupiedSquare = { row, col };
    this.addPieceOnSquare(piece, this.firstOccupiedSquare);
    const square = { row, col };
    return { piece, square };
  }

  /**
   * place a piece around a specific square
   */
  placePieceAroundSquare(piece, square) {
    const row = square.row;
    const col = square.col;
    const result = {};
    result.success = false;
    //this piece will occupy target square after the capture
    const availableSquares = this.getAvailableSourceSquaresForPlacement(piece, {row, col});
    if (availableSquares.length === 0) {
      //no more squares to choose
      result.success = false;
      return result;
    }
    //now we need to find a square to place the fromPiece
    const selectedSquare = availableSquares[
      Math.floor(Math.random() * availableSquares.length)
    ];

    this.board[selectedSquare.row][selectedSquare.col] = piece;

    if ('affectedRow' in square && 'affectedCol' in square) {
      this.board[square.affectedRow][square.affectedCol] = '*';
    }

    result.square = selectedSquare;
    result.success = true;
    return result;
  }

  generateSolution() {
    const solution = {};
    solution.captures = [];

    const maxCapturesPerPiece = 2;
    const gameTreeDepth = maxCapturesPerPiece + 1;
    const gameTreeSize = this.numOfPieces; //for N pieces, we will have N nodes in the game tree

    this.hasKing = Math.round(Math.random()); //will this solution contains king?
    if (this.hasKing) {
      this.availablePcs = [PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING];
    } else {
      this.availablePcs = [PAWN, KNIGHT, BISHOP, ROOK, QUEEN];
    }

    //generate the game tree, with levels ranging from 1 (the root node) to gameTreeDepth
    this.gameTreeNodes = this.generateGameTree(gameTreeSize, gameTreeDepth);

    //now find out all the leaf nodes, they are the nodes that launch captures
    const leafNodes = this.gameTreeNodes.filter((node) => {
      return node.numOfChilds === 0;
    });

    //generate the first piece
    const { piece, square } = this.generateFirstPiece();
    //also, we add the piece to the root node of the game tree
    this.gameTreeNodes[0].piece = piece;
    this.gameTreeNodes[0].square = square;

    leafNodes.forEach((leafNode, index) => {
      let isLastNode = false;
      if (index === leafNodes.length - 1) {
        isLastNode = true;
      }

      const nodesInPath = this.getNodesInPathOf(leafNode);

      for (;;) {
        let isCaptureValid = true;
        //special rule, the last one to stay must be king
        if (this.hasKing && isLastNode) {
          leafNode.piece = KING;
        } else {
          leafNode.piece = this.getRandomPiece();
        }

        //we need to make sure we can place piece around all path node squares
        nodesInPath.forEach((pathNode) => {
          if (pathNode.parentId !== null) { //make sure this is a non-root node
            pathNode.piece = this.getRandomPiece();
            const placementResult = this.placePieceAroundSquare(
              pathNode.piece,
              this.gameTreeNodes[pathNode.parentId].square
            );
            //set the node's square
            if (placementResult.square) {
              pathNode.square = placementResult.square;
            }
            isCaptureValid = isCaptureValid && placementResult.success;
          }
        });

        if (isCaptureValid) {
          break;
        }
      }

      /*
      if (node.level === 1) { //this is the root node
        this.generateFirstPiece();
        node.moves = []; //the root node should not have any moves
        node.square = this.firstOccupiedSquare;
      } else {
        const move = {
          from: { //from square
            row: 0,
            col: 0
          },
          to: { //to square
            row: 0,
            col: 0
          }
        };
        if (node.level === 2) {
      //the nodes are in second level, place a piece around the first occupied square
          node.piece = this.getRandomPiece();
          this.placePieceAroundSquare(node.piece, this.firstOccupiedSquare.row, this.firstOccupiedSquare.col);
        } else {
      //for captures in other levels,
        }
        */
    });

    return solution;
  }

  print() {
    console.log(this.board);
  }
}

const { PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING } = {
  PAWN: 'P',
  KNIGHT: 'N',
  BISHOP: 'B',
  ROOK: 'R',
  QUEEN: 'Q',
  KING: 'K'
};

const shuffleArr = (arr) => {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const arrToFen = (arr) => {
  const pieces = arr.map((row) => {
    let strRow = '';
    let counter = 0;
    row.forEach((square) => {
      //- means empty square, * means "empty but unavailable square"
      if (square === '-' || square === '*') {
        counter += 1;
      } else {
        if (counter !== 0) {
          strRow += counter;
          counter = 0;
        }
        strRow += square;
      }
    });
    strRow += (counter !== 0) ? counter : '';
    return strRow;
  }).join('/');

  return `${pieces} w KQkq - 0 1`;
};

function generatePosition(numOfPieces) {
  const board = new SoloChessBoard(numOfPieces);
  board.generateSolution();
  board.print();
}

/////////////////////// Main ///////////////////////////
generatePosition(16);