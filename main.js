var styles = document.createElement('STYLE');
styles.innerHTML = '\
{ padding: 8px; font: 12pt Arial; }\
  body { margin: 0 15%; }\
  table { border-collapse: collapse; margin-top: 20px; }\
  input[type="text"] {\
      font-weight: bold;\
      border: 1px solid #eee;\
      font-size: 14pt;\}\
  input[type="checkbox"] { margin: 10px; }\
  th { border: 2px solid white; }\
  td { width: 15%; border: 2px solid white; }\
  tr { background-color: #edf6f7; }\#playerTab tr { background-color: #83cdd5; }\#playerTab tr:nth-child(2n) { background-color: #FFC8A0; }\#playerTab th { background-color: #eff7f8; }\.red { background: #ff4949; font-weight: bold; }\.remover {\
      width: 20px;\
      font-weight: bold;\
      background: #bbb;\
      cursor: pointer;\}';
document.head.appendChild(styles);
