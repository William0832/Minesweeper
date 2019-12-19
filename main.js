// ========================= VIEW ===================
const view = {
  /**
   * displayFields()
   * 顯示踩地雷的遊戲版圖在畫面上，
   * 輸入的 rows 是指版圖的行列數。
   */
  displayFields(rows) {
    const playZone = document.querySelector('.play-zone');
    let tempText = '';
    let tempAry = [...Array(rows).keys()];
    tempAry.forEach(e1 => {
      tempText += `<div data-rol="${e1}" class="r d-flex">`;
      tempAry.forEach(e2 => {
        tempText += `<div data-index="${e1 * rows + e2}" class="field"></div>`;
      });
      tempText += '</div>';
    });
    playZone.innerHTML = tempText;
  },
  showTempDig(Idxs) {
    const fieldsElements = document.querySelectorAll('.field');
    Idxs.forEach(e => {
      fieldsElements[e].classList.toggle('digged');
      // 爆炸就不再挖了
      if (model.currentState === 'gameOver') {
        return;
      }
    });
  },
  /**
   * showFieldContent()
   *  field: 指定的單一格子物件
   *  action = 'dig': 更改單一格子的內容，像是顯示數字、地雷，或是海洋
   *         = 'putFlag': 插旗
   *         = 'removeFlag' : 拔旗
   */
  showFieldContent(field, action) {
    const index = field.index;
    const htmlText = {
      mine: '<i class="pl-1 mt-1 fas fa-bomb"></i>',
      flag: '<i class="pl-1 mt-1 fas fa-flag"></i>',
      number: `<div class="font-weight-bold text-center number-${field.number}-color"><h5>${field.number}</h5></div>`
    };
    const fieldsElements = document.querySelectorAll('.field');
    switch (action) {
      case 'dig':
        fieldsElements[index].classList.add('digged'); // 優先顯示為ocean
        //.type確認是否挖到炸彈
        if (field.type === 'mine') {
          fieldsElements[index].innerHTML = htmlText.mine;
        } else if (field.number > 0) {
          //.number確認是否挖到數字(不顯示0)
          fieldsElements[index].innerHTML = htmlText.number;
        }
        break;
      case 'putFlag':
        fieldsElements[index].innerHTML = htmlText.flag;
        break;
      case 'removeFlag':
        fieldsElements[index].innerHTML = '';
        break;
    }
  },
  /**
   * showBoard() 主程式用不到
   * 遊戲結束時，或是 debug 時將遊戲的全部格子內容顯示出來。
   */
  showBoard() {
    model.fields.forEach(field => {
      this.showFieldContent(field, 'dig');
    });
  },
  /**
   * render()
   * 顯示經過的遊戲時間在畫面上。
   */
  renderTime(time) {
    //  s >1000 歸零
    time = time % 1000;
    const timer = document.querySelector('#timer');
    // 百位 + 十位 + 個位
    let showTime =
      String(Math.floor(time / 100)) +
      String(Math.floor((time % 100) / 10)) +
      String(Math.floor((time % 100) % 10));
    timer.value = showTime;
  },
  /**
   * autoPutFlag()
   * 執行自動插旗
   */
  autoPutFlag() {
    model.fields.forEach(e => {
      if (e.type === 'mine') {
        this.showFieldContent(e, 'putFlag');
      }
    });
  },
  changeFace(emoji) {
    const face = document.getElementById('face');
    const emojis = {
      smile: '🙂',
      sunglasses: '😎',
      dizzy: '😵',
      surprise: '😮'
    };
    face.textContent = emojis[emoji];
  },
  showFlagCounter() {
    const target = document.querySelector('#flag-counter');
    let number = model.mines.length - model.flags.length;
    let firstString = String(Math.floor(number / 100));
    if (number < 0) {
      number *= -1;
      firstString = '-';
    }
    target.value =
      firstString +
      String(Math.floor((number % 100) / 10)) +
      String(Math.floor((number % 100) % 10));
  },
  showFieldResults(boomField) {
    const fields = document.querySelectorAll('.field');
    // 顯示全部地雷
    model.mines.forEach(e => {
      this.showFieldContent(model.fields[e], 'dig');
    });
    // 標示爆炸的區域
    fields[boomField.index].classList.add('boom');
    // 標示插錯的旗子
    const errorFlags = model.flags.filter(e => !model.mines.includes(e));
    if (errorFlags.length === 0) {
      return;
    }
    errorFlags.forEach(e => {
      fields[e].classList.add('error-flag');
    });
  },
  showGameResults(state) {
    const results = {
      win: {
        face: 'sunglasses',
        message: 'YOU WIN'
      },
      gameOver: {
        face: 'dizzy',
        message: 'GAME OVER'
      }
    };
    view.showFlagCounter();
    view.changeFace(results[state].face);
    setTimeout(e => {
      alert(results[state].message);
    }, 500);
  },
  renderBtnClicked(target) {
    target.classList.toggle('digged');
    setTimeout(e => {
      target.classList.toggle('digged');
    }, 450);
  },
  showResetClick(target) {
    target.classList.toggle('reset-click');
  },
  showRecords() {
    const recordsTbody = document.querySelector('#records-tbody');
    const rankList = recordsTbody.querySelectorAll('tr');
    for (let i = 0; i < rankList.length; i++) {
      let time = model.timeRecorder[i] || '-';
      rankList[i].innerHTML = `<td>${i + 1}</td> <td>${time} </td>`;
    }
  }
};
// ====================== CONTROLLER ================
const controller = {
  /**
   * initialGame()
   * 1.初始遊戲狀態
   * 2.初始fields
   * 3.設定炸彈
   * 4.設定 number & ocean
   * 5.清除旗子暫存
   * 6.顯示新遊戲畫面
   */
  initialize(numberOfRows, numberOfMines) {
    // 計時歸零、關閉
    view.renderTime((model.time = 0));
    clearInterval(model.startTimer);
    // 取得紀錄
    this.checkRecords();
    // 顯示紀錄
    view.showRecords();
    // 存size
    model.size = numberOfRows;
    // 初始遊戲狀態
    model.currentState = 'ready';
    // 初始fields
    model.fields = [];
    for (let i = 0; i < numberOfRows * numberOfRows; i++) {
      model.fields.push({
        index: i,
        type: '',
        number: 0,
        isDigged: false,
        isFlagged: false
      });
    }
    // 設定炸彈 & 第一次點擊機會
    model.firstClickChance = true;
    this.setMinesAndFields(numberOfMines);
    // 設定 number & ocean
    model.fields.forEach((e, index) => {
      if (e.type !== 'mine') {
        this.getFieldData(index);
      }
    });
    // 情除旗子
    model.flags = [];
    // 渲染新遊戲畫面
    view.changeFace('smile');
    view.displayFields(numberOfRows);
    view.showFlagCounter();
  },
  /**
   * setMinesAndFields()
   * 設定格子的內容，以及產生地雷的編號。
   */
  setMinesAndFields(numberOfMines) {
    // mines 存入隨機index(在fiels範圍內)
    model.mines = [];
    const indexAry = [...Array(model.fields.length).keys()];
    for (let i = 0; i < numberOfMines; i++) {
      let randomIndex = Math.floor(Math.random() * indexAry.length);
      model.mines.push(...indexAry.splice(randomIndex, 1));
    }
    // fields內特定物件再依mines內的index改成炸彈
    model.mines.forEach(e => {
      model.fields[e].type = 'mine';
    });
  },
  /**
   * getFieldData()
   * 取得單一格子的內容，決定這個格子是海洋還是號碼，
   * 如果是號碼的話，要算出這個號碼是幾號。
   * （計算周圍地雷的數量）
   */
  getFieldData(fieldIdx) {
    const aroundIndex = this.getAroundIndex(fieldIdx);
    let minesCounter = 0;
    //用aroundIndex當索引檢查fields，並統計炸彈數
    aroundIndex.forEach(e => {
      if (model.fields[e].type === 'mine') {
        minesCounter++;
      }
    });
    // 用minesCounter數量，辨別格子是海洋or號碼
    if (minesCounter > 0 && !model.isMine(fieldIdx)) {
      model.fields[fieldIdx].type = 'number';
      model.fields[fieldIdx].number = minesCounter;
    } else if (minesCounter === 0 && !model.isMine(fieldIdx)) {
      model.fields[fieldIdx].number = 0;
      model.fields[fieldIdx].type = 'ocean';
    }
  },
  /**
   * getAroundIndex(fieldIdx)
   * 找出目標周邊的index關係，並將index存入陣列後回傳
   * */
  getAroundIndex(fieldIdx) {
    // 8 種case: T、B、R、L、TL、TR、BL、BR
    const ary = [];
    const size = model.size;
    // +T(不在第一排)
    if (fieldIdx - size >= 0) {
      ary.push(fieldIdx - size);
      // +TL(且不在最左邊)
      if (fieldIdx % size !== 0) {
        ary.push(fieldIdx - size - 1);
      }
      // +TR(且不在最右邊)
      if (fieldIdx % size !== size - 1) {
        ary.push(fieldIdx - size + 1);
      }
    }
    // +L(不在最左邊)
    if (fieldIdx % size !== 0) {
      ary.push(fieldIdx - 1);
    }
    // +R(不在最右邊)
    if (fieldIdx % size !== size - 1) {
      ary.push(fieldIdx + 1);
    }
    // +B(不在最後一排)
    if (fieldIdx < model.fields.length - size) {
      ary.push(fieldIdx + size);
      // +BL(且不在最左邊)
      if (fieldIdx % size !== 0) {
        ary.push(fieldIdx + size - 1);
      }
      // +BR(且不在最右邊)
      if (fieldIdx % size !== size - 1) {
        ary.push(fieldIdx + size + 1);
      }
    }
    return ary;
  },
  /**
   * dig()
   * 使用者挖格子時要執行的函式，
   * 會根據挖下的格子內容不同，執行不同的動作，
   * 如果是號碼或海洋 => 顯示格子
   * 如果是地雷       => 遊戲結束
   */
  dig(field) {
    if (!field) {
      return;
    }
    field.isDigged = true;
    // 挖到炸彈
    switch (field.type) {
      case 'mine':
        //第一次點炸彈會換位置
        if (model.firstClickChance) {
          this.changeMineLocation(field);
          model.firstClickChance = false;
          this.dig(field);
          return;
        }
        // 遊戲結束
        model.currentState = 'gameOver';
        this.checkTimer();
        view.showFieldResults(field);
        view.showGameResults(model.currentState);
        return;
      // 挖到數字
      case 'number':
        model.firstClickChance = false;
        view.showFieldContent(field, 'dig');
        this.checkWin();
        return;
      //挖到ocean => 擴散
      default:
        model.firstClickChance = false;
        this.spreadOcean(field);
        this.checkWin();
        return;
    }
  },
  digAroundFields(fieldIdx) {
    // 周圍插旗區域
    const aroundflagsIdxs = this.getAroundIndex(fieldIdx).filter(
      e => model.fields[e].isFlagged
    );
    // 周圍 未挖 or 未插旗 為周圍特定區域
    const aroundTargetIdxs = this.getAroundIndex(fieldIdx).filter(
      e => !model.fields[e].isDigged && !model.fields[e].isFlagged
    );
    // 如果 空格被挖開 & 號碼為周圍插旗數 => 挖周圍特定區域
    if (
      model.fields[fieldIdx].isDigged &&
      model.fields[fieldIdx].number === aroundflagsIdxs.length
    ) {
      aroundTargetIdxs.forEach(e => {
        this.dig(model.fields[e]);
      });
      // 目標未挖且未插旗 就加入
    } else if (
      !model.fields[fieldIdx].isDigged &&
      !model.fields[fieldIdx].isFlagged
    ) {
      aroundTargetIdxs.push(fieldIdx);
      view.showTempDig(aroundTargetIdxs);
    } else {
      view.showTempDig(aroundTargetIdxs);
    }
  },
  /**
   * putOrRemoveFlag()
   * 增加旗幟 or 移除旗幟
   */
  putOrRemoveFlag(field) {
    const index = +field.index;
    // 插旗加入index
    if (!model.flags.includes(index)) {
      model.fields[index].isFlagged = true;
      model.flags.push(index); //index存入model.flags陣列中
      view.showFieldContent(field, 'putFlag'); // 渲染插旗
      view.showFlagCounter();
      this.checkWin();
    } else {
      //拔旗，移除index
      model.fields[index].isFlagged = false;
      model.flags.splice(model.flags.indexOf(index), 1);
      view.showFieldContent(field, 'removeFlag'); //渲染拔旗
      view.showFlagCounter();
    }
  },
  /**
   * checkWin()
   * 確認贏得遊戲
   */
  checkWin() {
    let flagConter = 0;
    let unDigCounter = 0;
    function doWinActions() {
      controller.checkTimer();
      controller.checkRecords();
      view.showRecords();
      view.showGameResults(model.currentState);
    }
    model.fields.forEach(e => {
      if (!e.isDigged) {
        unDigCounter++;
      }
    });
    model.flags.forEach(e => {
      if (model.mines.includes(e)) {
        flagConter++;
      }
    });
    // win by put flags (旗子都插對 + 未開格子都是炸彈)
    if (flagConter === model.mines.length && unDigCounter === flagConter) {
      model.currentState = 'win';
      doWinActions();
      return;
      //win by dig fields(except mines)
    } else if (unDigCounter === model.mines.length) {
      model.currentState = 'win';
      model.flags = model.mines;
      view.autoPutFlag();
      doWinActions();
      return;
    }
  },
  /**
   * spreadOcean()
   * 展開海洋
   */
  spreadOcean(field) {
    // 顯示field
    view.showFieldContent(field, 'dig');
    field.isDigged = true;
    const index = field.index;
    const around = this.getAroundIndex(index);
    // 取得周圍得fields
    around.forEach(e => {
      // 數字 && 未插旗 => 挖~
      if (model.fields[e].type === 'number' && !model.flags.includes(e)) {
        this.dig(model.fields[e]);
      }
      //ocean && 沒挖過 && 未插旗 => 繼續擴散
      if (
        model.fields[e].type === 'ocean' &&
        !model.fields[e].isDigged &&
        !model.flags.includes(e)
      ) {
        this.spreadOcean(model.fields[e]);
      }
    });
  },
  changeMineLocation(field) {
    const index = field.index;
    //移除這次的炸彈 (處理index、fields)
    model.mines.splice(model.mines.indexOf(index), 1);
    // 由非炸彈區產生新炸彈index
    const noMineIndexAry = [];
    model.fields.forEach(e => {
      if (e.type !== 'mine') {
        noMineIndexAry.push(e.index);
      }
    });
    const newMineIndex =
      noMineIndexAry[Math.floor(Math.random() * noMineIndexAry.length)];
    //加回mines
    model.mines.push(newMineIndex);
    model.fields[newMineIndex].type = 'mine';
    model.fields[newMineIndex].number = 0;
    model.fields[index].isDigged = false;
    //處理fields
    model.fields[index].type = '';
    model.fields.forEach((e, i) => {
      this.getFieldData(i);
    });
  },
  checkTimer() {
    // gameOver or win 狀態 => 結束計時
    if (model.currentState === 'gameOver' || model.currentState === 'win') {
      return clearInterval(model.startTimer);
    }
    //啟動計時器(啟動當下就是1s)
    view.renderTime((model.time = 1));
    model.startTimer = setInterval(function() {
      model.time += 1;
      view.renderTime(model.time);
    }, 1000);
  },
  checkCustomMinesRange(size) {
    const maxNumberofMine = (size - 1) ** 2;
    return maxNumberofMine;
  },
  checkRecords() {
    if (model.gameType !== 'normal' || model.currentState === 'gameOver') {
      return;
    }
    model.timeRecorder = JSON.parse(localStorage.getItem('timeRecorder')) || [];
    // 將目前獲勝時間加入timeRecods[]中，保留非0資料，並由小到大排序，最後只保留前5項
    model.timeRecorder.push(model.time);
    model.timeRecorder = model.timeRecorder
      .filter(e => e > 0)
      .sort((a, b) => a - b)
      .splice(0, 5);
    // 存回localStorage
    localStorage.setItem('timeRecorder', JSON.stringify(model.timeRecorder));
  },
  // event Listener
  listenPlay() {
    let isBothDown = false;
    let isLefdown = false;
    // 防止預設右鍵清單跳出
    document.addEventListener('contextmenu', event => {
      event.preventDefault();
    });
    // 遊戲區事件監聽：
    // mouse down 左鍵 => 表情驚訝
    document
      .querySelector('.play-zone')
      .addEventListener('mousedown', event => {
        const index = Number(
          event.target.parentElement.parentElement.dataset.index ||
            event.target.parentElement.dataset.index ||
            event.target.dataset.index
        );
        let field = model.fields[index];
        // 左下 => 表情驚訝
        if (event.button === 0 && model.currentState !== 'gameOver') {
          view.changeFace('surprise');
          isBothDown = false;
          // oneField temp dig + 拖曳
        }
        // 右下 => 插拔旗
        if (event.button === 2 && event.buttons !== 3 && !field.isDigged) {
          isBothDown = false;
          this.putOrRemoveFlag(field);
        }
        // 雙下 => aroudField dig
        if (event.buttons === 3) {
          isBothDown = true;
          view.changeFace('surprise');
          this.digAroundFields(index);
        }
      });
    //  mouse up
    //  左鍵 => dig
    //  右鍵 => put or remove flag
    document.querySelector('.play-zone').addEventListener('mouseup', event => {
      // mouseup + ready 狀態 => 啟動計時 (playing狀態不觸發)
      // 任一up 開始計時
      if (model.currentState === 'ready') {
        this.checkTimer();
      }
      const index = Number(
        event.target.parentElement.parentElement.dataset.index ||
          event.target.parentElement.dataset.index ||
          event.target.dataset.index
      );
      const field = model.fields[index];
      //ready & playing狀態，點擊事件繼續
      if (model.currentState === 'ready' || model.currentState === 'playing') {
        model.currentState = 'playing';
        if (!event.button) {
          view.changeFace('smile');
        }
        if (
          (event.button === 2 && event.buttons === 1) ||
          (!event.button && event.buttons === 2)
        ) {
          this.digAroundFields(index);
        } else if (!event.button) {
          if (!isBothDown && !field.isFlagged) {
            this.dig(field);
            isBothDown = false;
          }
        }
      }
    });
  },
  listenReset() {
    let isDown = false;
    const reset = document.querySelector('.reset');
    const face = document.getElementById('face');
    document.querySelector('body').addEventListener('mousedown', event => {
      //只接受左鍵
      if (event.buttons !== 1) {
        return;
      }
      // 可能點到按鍵or笑臉
      if (event.target === reset || event.target === face) {
        isDown = true;
        view.showResetClick(reset);
      }
    });
    document.querySelector('body').addEventListener('mouseup', event => {
      // 沒有按下 or 其他按鍵事件都不接受
      if (!isDown || event.button) {
        return;
      }
      isDown = false;
      // 在reset or face 上放開才觸發
      if (event.target === reset || event.target === face) {
        view.showResetClick(reset);
        this.initialize(model.size, model.mines.length);
      }
    });
    reset.addEventListener('mouseleave', event => {
      if (isDown) {
        view.showResetClick(reset);
      }
    });
    reset.addEventListener('mouseenter', event => {
      if (isDown) {
        view.showResetClick(reset);
      }
    });
  },
  listenChangeType() {
    const typeOption = document.querySelector('#type-option');
    const customBtn = document.querySelector('#customBtn');
    // elements in modal
    const customNewGame = document.querySelector('#custom-newGame');
    const sizeInput = document.querySelector('#size-input');
    const sizeValue = document.querySelector('#size-value');
    const minesInput = document.querySelector('#mines-input');
    const minesValue = document.querySelector('#mines-value');
    const minesRange = document.querySelector('#mines-range');
    let customsize = 15;
    let customMines = 30;
    let maxNumberofMine = 0;
    //change normal-type
    typeOption.addEventListener('click', event => {
      if (event.target.id === 'normalBtn') {
        model.gameType = 'normal';
        view.renderBtnClicked(event.target);
        controller.initialize(9, 12);
      }
    });
    //modal-custom slider
    sizeInput.addEventListener('input', event => {
      customsize = event.target.value;
      maxNumberofMine = this.checkCustomMinesRange(customsize);
      sizeValue.textContent = customsize;
      minesInput.max = maxNumberofMine;
      minesRange.textContent = `Mines(1~${maxNumberofMine})`;
      minesValue.textContent = minesInput.value;
      //
      minesInput.addEventListener('input', event1 => {
        customMines = event1.target.value;
        minesValue.textContent = customMines;
      });
    });
    //new game
    customNewGame.addEventListener('click', event => {
      model.gameType = 'custom';
      view.renderBtnClicked(customBtn);
      controller.initialize(+customsize, +customMines);
    });
  },
  listenClearRecords() {
    const clearBtn = document.querySelector('#clearBtn');
    clearBtn.addEventListener('click', e => {
      model.timeRecorder = [];
      localStorage.removeItem('timeRecorder');
      view.showRecords();
    });
  }
};
// ======================== MODEL ===================
const model = {
  gameType: 'normal',
  time: 0,
  timeRecorder: [],
  firstClickChance: true,
  currentState: 'ready',
  /**
   * mines
   * 存放地雷的編號（第幾個格子）
   */
  mines: [],
  /**
   * flags
   * 存放旗子的index
   */
  flags: [],
  /**
   * fields
   * 存放格子內容，這裡同學可以自行設計格子的資料型態，
   * 例如：
   * {
   *   type: "number",
   *   number: 1,
   *   isDigged: false
   * }
   */
  fields: [],
  /**
   * isMine()
   * 輸入一個格子編號，並檢查這個編號是否是地雷
   */
  isMine(fieldIdx) {
    return this.mines.includes(fieldIdx);
  }
};
// ========================= MAIN ===================
controller.initialize(9, 12);
// 避免重複呼叫監聽，所以寫在最外層，
// 一開始監聽寫在主程式底下，切換模式後會多次觸發，產生奇怪的BUG
controller.listenChangeType();
controller.listenReset();
controller.listenPlay();
controller.listenClearRecords();
