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
  var currentQuery = '';

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]; });
  }
  function escapeRegExp(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function highlight(text, q){
    if(!q) return escapeHtml(text);
    try{
      var re = new RegExp(escapeRegExp(q), 'gi');
      return escapeHtml(text).replace(re, function(m){ return '<mark>' + m + '</mark>'; });
    }catch(e){ return escapeHtml(text); }
  }

  function renderGallery(data, query){
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
      img.loading = 'lazy';

      var caption = document.createElement('div');
      caption.className = 'gallery-caption';
      var title = document.createElement('span');
      title.className = 'title';
      var desc = document.createElement('span');
      desc.className = 'desc';

      // Use HTML to allow <mark> highlighting
      title.innerHTML = highlight(item.Title || item.ID || '', query);
      desc.innerHTML = highlight(item.Description || '', query);

      caption.appendChild(title);
      if((item.Description||'').trim()) caption.appendChild(desc);

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
    var clearBtn = document.getElementById('gallery-clear');
    if(!input) return;
    var onInput = debounce(function(){
      var q = (input.value || '').trim();
      currentQuery = q;
      if(!q){ renderGallery(allData, ''); return; }
      var ql = q.toLowerCase();
      var filtered = allData.filter(function(it){
        var hay = ((it.Title||'') + ' ' + (it.Description||'')).toLowerCase();
        return hay.indexOf(ql) !== -1;
      });
      renderGallery(filtered, q);
    }, 200);
    input.addEventListener('input', onInput);
    if(clearBtn){
      clearBtn.addEventListener('click', function(){ input.value = ''; currentQuery=''; renderGallery(allData,''); input.focus(); });
    }
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
