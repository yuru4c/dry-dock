# DryDock

**この `README.md` は書きかけです。**

## 概要
ウィンドウドッキングの軽量な実装です。

## 使い方
初期レイアウトを作成する準備をします。
```html
<head>
	<link rel="stylesheet" href="drydock/style.css">
</head>
<body>
	<div id="dock">
		<div id="main" data-dd-title="メイン">メイン</div>
		<div id="sub1" data-dd-title="サブ1">サブ1</div>
		<div id="sub2" data-dd-title="サブ2">サブ2</div>
	</div>
	
	<script src="drydock/script.js"></script>
	<script>
		var dock = document.getElementById('dock');
		var dd = new DryDock(dock);
		
		dd.init();
		dd.openMain(dd.contents['main']);
		dd.openSub(dd.contents['sub1']);
		dd.openSub(dd.contents['sub2']);
	</script>
</body>
```

ドキュメントを開き初期レイアウトを作成します。  
完成したら、コンソール等から `dd.serialize()` を実行してください。  
得られた文字列によってレイアウトを復元できます。
```javascript
var dock = document.getElementById('dock');
var dd = new DryDock(dock);

dd.restore('{}'); // dd.serialize() の戻り値を渡す
```

---

メインタブは指定の要素で開くことができます。
```javascript
var content = dd.open(element);
```

タイトルは変更できます。
```javascript
content.setTitle('タイトル');
```

タブは閉じることができます。
```javascript
content.close();
```

`onclose` プロパティに関数を設定すると、そのタブを閉じようとしたときに呼び出されます。  
`false` が返されると、閉じるのをやめます。
```javascript
content.onclose = function () {
	return confirm('閉じますか？');
};
```

タブが閉じられているか確認できます。
```javascript
var boolean = content.isClosed();
```

## 備考
