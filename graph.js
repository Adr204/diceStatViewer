class Graph {
    constructor() {
        this.target = document.getElementById("canvas_area");
        this.lineWidth = 0.6;
        this.cellHeight = 10;

        this.graphSize = {
            width: 300,
            height: 200
        };
        this.canvasSize = {
            width: this.graphSize.width,
            height: this.graphSize.height + this.cellHeight * 2
        };

        this.color = {
            background: "white",
            lineStrong: "#f21b1b",
            scale: "black",
            line: "#d1e3e1",
            cell: "#a9d1db",
            text: "black"
        };

        this.font = {
            scale: `${this.cellHeight}px sans-serif`,
            text: "14px sans-serif"
        };
    }
    createCanvas(isSmall = false) {
        let canvas = document.createElement("canvas");
        let size = isSmall ? this.graphSize : this.canvasSize;
        canvas.width  = size.width;
        canvas.height = size.height;

        return canvas;
    }
    drawGraph(data, names) {
        let canvas = this.createCanvas();
        let graph  = this.createCanvas(true);
        
        let ctx = canvas.getContext("2d");
        ctx.fillStyle = this.color.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.putCell(data, graph);
        this.putLine(graph);
        this.putScale(data, canvas);
        this.putGraph(graph, canvas);
        this.putName(names, canvas);
        this.putCount(data, canvas);

        return canvas;
    }
    putName(names, canvas) {
        let ctx = canvas.getContext("2d");
        ctx.fillStyle = this.color.text;
        ctx.font = this.font.text;
        let name = names.length == 1 ? names[0] : names[0] + "...";

        ctx.fillText(name, 0, 20);
    }
    putCount(data, canvas) {
        let ctx = canvas.getContext("2d");
        ctx.fillStyle = this.color.text;
        ctx.font = this.font.text;

        let total = data.reduce((prev, current) => {
            return prev + current;
        }, 0);

        ctx.fillText(`Dice: ${total}回`, 0, 40);
    }
    putCell(data, graph) {
        let ctx = graph.getContext("2d");
        ctx.fillStyle = this.color.cell;

        data.forEach((v, i) => {
            let cellWidth = graph.width / data.length;
            ctx.fillRect(cellWidth * i, graph.height, cellWidth, -this.cellHeight*v);
        });
    }
    putLine(graph) {
        let ctx = graph.getContext("2d");

        for(let i = 1; i < graph.height / this.cellHeight; i++) {
            let y = graph.height - (this.cellHeight * i + this.lineWidth / 2);
            ctx.fillStyle = i % 5 == 0 ? this.color.lineStrong
                                       : this.color.line;
            
            ctx.fillRect(0, y, graph.width, this.lineWidth);
        }
    }
    putScale(data, canvas) {
        let ctx = canvas.getContext("2d");
        ctx.fillStyle = this.color.scale;
        ctx.font = this.font.scale;

        data.forEach((v, i) => {
            let text = String((i+1) * 5);
            if(text == "100") text = "00";
            let textWidth = ctx.measureText(text).width;

            ctx.fillText(text, canvas.width / data.length * (i+0.5) - textWidth / 2, canvas.height - this.cellHeight / 2);
        });
    }
    putGraph(graph, canvas) {
        let ctx = canvas.getContext("2d");

        ctx.drawImage(graph, 0, 0);
    }
}

class Log2Data {
    constructor(html) {
        this.listItem = [];

        this.selectElem = document.getElementById("charactor");
        this.selectElem.addEventListener("change", () => {
            console.log(this.SelectedNames);
        })
        this.CharactorName = new Set();

        this.addData(html);
    }
    get SelectedNames() {
        let result = [];
        [...this.selectElem.children].forEach(e => {
            let input = e.querySelector("input");
            if(input.checked) result.push(input.id);
        })
        return result;
    }
    str2html(str) {
        let div = document.createElement("div");
        div.innerHTML = str;
        
        return div;
    }
    addData(str) {
        let html = this.str2html(str);
        let addP, addCCB, addItem;

        addP   = [...html.querySelectorAll("p")];
        addCCB = [...this.extractCCB(addP)];
        addItem = [...this.classify(addCCB)];
        this.listItem = this.listItem.concat(addItem);
        console.log(this.listItem);

        this.listItem.forEach(e => {
            this.CharactorName.add(e.from);
        })

        this.addName();
    }
    extractCCB(list) {
        let result = [];
        const query = /s?CCB<=[0-9+*/-]+ 【.+】 \(1D100<=[0-9]+\) ＞ [0-9]+ ＞ .+/;

        list.forEach(e => {
            let text = e.children[2].innerText;
            if(text.match(query)) result.push(e);
        });

        return result;
    }
    classify(list) {
        let result = list.map(e => {
            let text = e.children[2].innerText;
        
            return {
                from: e.children[1].innerText,
                skill: text.match(/【.+】/)[0],
                judge: text.match(/ ＞ [^0-9]+/)[0].slice(3),
                target: text.match(/1D100<=[0-9]+/)[0].slice(7),
                result: text.match(/ ＞ [0-9]+/)[0].slice(3)    
            };
        });

        return result;
    }
    viewCharactor() {
        this.CharactorName.forEach(e => {
            console.log(e);
        })

        return [...this.CharactorName];
    }
    addName() {
        let html = ``;
        for(let chara of this.viewCharactor()) {
            html += `<label for="${chara}"><input type="checkbox" id="${chara}">${chara}</input></label>\n`;
        }

        this.selectElem.innerHTML = html;
    }
    filterName(names) {
        let result = [];
        this.listItem.forEach(e => {
            let check = names.some((v) => {
                return e.from == v;
            })
            if(check) result.push(e); 
        })

        return result;
    }
}

let d = new Log2Data();
let input = document.getElementById("input_data");
input.addEventListener("change", parseFile);

function parseFile(e) {
    console.log(e);
    for(file of e.target.files) {
        let fr = new FileReader();
        fr.onload = (e) => {
            d.addData(e.target.result);
        }

        fr.readAsText(file)
    }
}

let g = new Graph();
function transformGraphData(Items, split = 20) {
    let data = new Array(split);
    data.fill(0);

    for(let item of Items) {
        let classValue = Math.floor((item.result-1) * split / 100);
        data[classValue]++;
    }

    return data;
}

function canvasDelete(e) {
    e.target.parentElement.remove();
}

let button = document.getElementById("run");
button.addEventListener("click", e => {
    if(!d.SelectedNames.length) return 0;

    let items = d.filterName(d.SelectedNames)
    let data = transformGraphData(items);

    let wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.width = "fit-content";
    let xButton = document.createElement("button");
    xButton.innerHTML = "x";
    xButton.style.position = "absolute";
    xButton.style.top = 0;
    xButton.style.right = 0;
    xButton.style.border = "none";
    xButton.addEventListener("click", canvasDelete);
    let canvas = g.drawGraph(data, d.SelectedNames);

    wrapper.appendChild(canvas);
    wrapper.appendChild(xButton);

    g.target.append(wrapper);
});

/**
 * @todo
 * 名前の複数選択を可能に
 * canvasの削除機能
 * 見た目調整
 * 成功失敗等の円グラフを追加
 */
