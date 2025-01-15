// 初始化JSON编辑器
const container = document.getElementById("jsoneditor");
const options = {
  mode: "code",
  modes: ["code", "tree", "form", "text", "view"],
  onError: function (err) {
    alert(err.toString());
  },
};
const editor = new JSONEditor(container, options);

// 初始化Handsontable
const hotContainer = document.getElementById("hot");
const hot = new Handsontable(hotContainer, {
  data: [],
  rowHeaders: true,
  colHeaders: true,
  height: "100%",
  width: "100%",
  licenseKey: "non-commercial-and-evaluation",
  contextMenu: {
    items: {
      row_remove: {
        name: "删除行",
        callback: function (key, selection) {
          const selected = hot.getSelected() || [];
          if (selected.length > 0) {
            removeRow(selected[0][0]);
          }
        },
      },
      col_remove: {
        name: "删除列",
        callback: function (key, selection) {
          const selected = hot.getSelected() || [];
          if (selected.length > 0) {
            removeCol(selected[0][1]);
          }
        },
      },
    },
  },
});

// 将JSON转换为表格数据
function jsonToTableData(json) {
  try {
    if (!Array.isArray(json)) {
      json = [json];
    }

    // 获取所有唯一键作为表头
    const headers = [...new Set(json.flatMap(Object.keys))];

    // 生成A,B,C...字母序列作为表头
    const colHeaders = headers.map((_, i) => String.fromCharCode(65 + i));

    // 创建表格数据，第一行为原属性名
    const data = [
      headers,
      ...json.map((item) => {
        return headers.map((header) => {
          const value = item[header];
          return typeof value === "object" ? JSON.stringify(value) : value;
        });
      }),
    ];

    return {
      headers: colHeaders,
      data,
    };
  } catch (error) {
    console.error("JSON转换失败:", error);
    return {
      headers: [],
      data: [],
    };
  }
}

// 将表格数据转换为JSON
function tableToJsonData() {
  const headers = hot.getColHeader();
  const data = hot.getData();

  // 第一行是原属性名
  const realHeaders = data[0];

  // 从第二行开始是实际数据
  return data.slice(1).map((row) => {
    const obj = {};
    realHeaders.forEach((header, index) => {
      try {
        obj[header] = JSON.parse(row[index]);
      } catch {
        obj[header] = row[index];
      }
    });
    return obj;
  });
}

// 更新表格数据
function updateTable() {
  try {
    const json = editor.get();
    const { headers, data } = jsonToTableData(json);

    // 更新表格
    hot.updateSettings({
      colHeaders: headers,
      data: data,
    });
  } catch (error) {
    alert("无效的JSON格式");
  }
}

// 监听表格编辑事件
hot.addHook("afterChange", (changes, source) => {
  if (source === "edit") {
    try {
      const json = tableToJsonData();
      editor.set(json);
    } catch (error) {
      console.error("更新JSON失败:", error);
    }
  }
});

// 增加新行
function addRow() {
  const data = hot.getData();
  const newRow = new Array(hot.countCols()).fill("");
  hot.alter("insert_row", data.length, 1);

  // 更新JSON数据
  const json = tableToJsonData();
  editor.set(json);
}

// 增加新列
function addCol() {
  const headers = hot.getColHeader();
  const newHeader = `列${headers.length + 1}`;
  hot.alter("insert_col", headers.length, 1);
  hot.setDataAtCell(0, headers.length, newHeader);

  // 更新JSON数据
  const json = tableToJsonData();
  editor.set(json);
}

// 删除行
function removeRow(index) {
  // 确保index有效
  if (index >= 0 && index < hot.countRows()) {
    hot.alter("remove_row", index, 1);

    // 更新JSON数据
    const json = tableToJsonData();
    editor.set(json);
  }
}

// 删除列
function removeCol(index) {
  // 确保index有效
  if (index >= 0 && index < hot.countCols()) {
    hot.alter("remove_col", index, 1);

    // 更新JSON数据
    const json = tableToJsonData();
    editor.set(json);
  }
}

// 绑定按钮点击事件
document.getElementById("updateTable").addEventListener("click", updateTable);
document.getElementById("addRow").addEventListener("click", addRow);
document.getElementById("addCol").addEventListener("click", addCol);

// 初始化示例数据
editor.set([
  {
    姓名: "张三",
    年龄: 25,
    地址: {
      城市: "北京",
      街道: "长安街",
    },
  },
  {
    姓名: "李四",
    年龄: 30,
    地址: {
      城市: "上海",
      街道: "南京路",
    },
  },
]);

// 初始渲染表格
updateTable();
