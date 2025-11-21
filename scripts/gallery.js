// scripts/gallery.js
// Build a simple gallery from the CSV string `data2bImages`.
(function(){
  function parseCSV(s){
    if(!s) return [];
    var lines = s.trim().split(/\r?\n/);
    if(lines.length<=1) return [];
    var header = lines.shift().split(',');
    return lines.map(function(line){
      var parts = line.split(',');
      return {
        ID: parts[0] ? parts[0].trim() : '',
        Title: parts[1] ? parts[1].trim() : '',
        Description: parts[2] ? parts[2].trim() : '',
        Image: parts[3] ? parts[3].trim() : ''
      };
    });
  }

  function buildGallery(data){
    var container = document.getElementById('gallery-container');
    if(!container) return;
    var grid = document.createElement('div');
    grid.className = 'gallery-grid';

    data.forEach(function(item){
      var itemWrap = document.createElement('div');
      itemWrap.className = 'gallery-item';

      var img = document.createElement('img');
      img.src = item.Image || '';
      img.alt = item.Title || item.ID || '';
      img.className = 'expandable-img';
      // allow modal to use full src (same here)
      img.setAttribute('data-fullsrc', item.Image || '');

      var caption = document.createElement('div');
      caption.className = 'gallery-caption';
      var title = document.createElement('span');
      title.className = 'title';
      title.textContent = item.Title || item.ID || '';
      var desc = document.createElement('span');
      desc.className = 'desc';
      desc.textContent = item.Description || '';

      caption.appendChild(title);
      if(desc.textContent) caption.appendChild(desc);

      itemWrap.appendChild(img);
      itemWrap.appendChild(caption);
      grid.appendChild(itemWrap);
    });

    container.appendChild(grid);
  }

  document.addEventListener('DOMContentLoaded', function(){
    try{
      var data = parseCSV(window.data2bImages);
      buildGallery(data);
    }catch(e){
      console.warn('gallery build failed', e);
    }
  });
})();
