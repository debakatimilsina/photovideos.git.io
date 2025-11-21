// scripts/gallery.js
// Build a simple gallery from the CSV string `data2bImages`.
(function(){
  function parseCSV(s){
    if(!s) return [];
    var lines = s.trim().split(/\r?\n/);
    if(lines.length<=1) return [];
    lines.shift(); // drop header
    return lines.map(function(line){
      // split into up to 4 fields: ID,Title,Description,Image (image may contain commas)
      var parts = line.split(',');
      var id = (parts[0]||'').trim();
      var title = (parts[1]||'').trim();
      var desc = (parts[2]||'').trim();
      var image = parts.slice(3).join(',').trim();
      return { ID: id, Title: title, Description: desc, Image: image };
    });
  }

  var allData = [];

  function renderGallery(data){
    var container = document.getElementById('gallery-container');
    if(!container) return;
    container.innerHTML = '';
    var grid = document.createElement('div');
    grid.className = 'gallery-grid';

    data.forEach(function(item){
      var itemWrap = document.createElement('div');
      itemWrap.className = 'gallery-item';

      var img = document.createElement('img');
      img.src = item.Image || '';
      img.alt = item.Title || item.ID || '';
      img.className = 'expandable-img';
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

  function debounce(fn, wait){
    var t = null;
    return function(){
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function(){ fn.apply(null, args); }, wait);
    };
  }

  function setupSearch(){
    var input = document.getElementById('gallery-search');
    if(!input) return;
    var onInput = debounce(function(){
      var q = (input.value || '').trim().toLowerCase();
      if(!q){ renderGallery(allData); return; }
      var filtered = allData.filter(function(it){
        var hay = ((it.Title||'') + ' ' + (it.Description||'')).toLowerCase();
        return hay.indexOf(q) !== -1;
      });
      renderGallery(filtered);
    }, 200);
    input.addEventListener('input', onInput);
  }

  document.addEventListener('DOMContentLoaded', function(){
    try{
      allData = parseCSV(window.data2bImages);
      renderGallery(allData);
      setupSearch();
    }catch(e){
      console.warn('gallery build failed', e);
    }
  });
})();
