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
  var pageSize = 12; // items per page
  var currentOffset = 0;

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

  function renderGallery(data, query, offset, limit){
    var container = document.getElementById('gallery-container');
    if(!container) return;
    container.innerHTML = '';
    var grid = document.createElement('div');
    grid.className = 'gallery-grid';

    var slice = data.slice(offset, offset + limit);
    slice.forEach(function(item){
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

    // Load more wrapper
    var wrap = document.createElement('div');
    wrap.className = 'gallery-loadmore-wrap';
    if(offset + limit < data.length){
      var btn = document.createElement('button');
      btn.className = 'gallery-loadmore';
      btn.textContent = 'Load more';
      btn.addEventListener('click', function(){
        currentOffset = currentOffset + pageSize;
        renderGallery(data, query, currentOffset, pageSize);
      });
      wrap.appendChild(btn);
    }
    container.appendChild(wrap);
  }

  function debounce(fn, wait){
    var t = null;
    return function(){
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function(){ fn.apply(null, args); }, wait);
    };
  }

  function buildSuggestionsIndex(data){
    var suggestions = [];
    data.forEach(function(it){
      if(it.Title) suggestions.push(it.Title);
      if(it.Description) suggestions.push(it.Description);
    });
    // unique and short
    var seen = {};
    var list = suggestions.map(function(s){ return (s||'').trim(); }).filter(Boolean).filter(function(s){
      var key = s.toLowerCase();
      if(seen[key]) return false; seen[key]=true; return true;
    });
    return list;
  }

  function showSuggestions(matches){
    var box = document.getElementById('gallery-suggestions-list');
    if(!box) return;
    box.innerHTML = '';
    if(!matches || matches.length===0){ box.style.display='none'; return; }
    matches.slice(0,20).forEach(function(m){
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = m;
      btn.addEventListener('click', function(){
        var input = document.getElementById('gallery-search');
        input.value = m;
        input.dispatchEvent(new Event('input'));
        box.style.display='none';
      });
      box.appendChild(btn);
    });
    box.style.display = 'block';
  }

  function setupSearch(){
    var input = document.getElementById('gallery-search');
    var clearBtn = document.getElementById('gallery-clear');
    var suggestionsBox = document.getElementById('gallery-suggestions-list');
    if(!input) return;
    var suggestionsIndex = buildSuggestionsIndex(allData);

    var onInput = debounce(function(){
      var q = (input.value || '').trim();
      currentQuery = q;
      if(!q){ currentOffset=0; renderGallery(allData,'',currentOffset,pageSize); showSuggestions([]); return; }
      var ql = q.toLowerCase();
      var filtered = allData.filter(function(it){
        var hay = ((it.Title||'') + ' ' + (it.Description||'')).toLowerCase();
        return hay.indexOf(ql) !== -1;
      });
      currentOffset = 0;
      renderGallery(filtered, q, currentOffset, pageSize);

      // show suggestions matching start of words
      var sugg = suggestionsIndex.filter(function(s){ return s.toLowerCase().indexOf(ql) !== -1; }).slice(0,10);
      showSuggestions(sugg);
    }, 150);
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', function(e){ if(e.key==='Escape'){ suggestionsBox.style.display='none'; } });
    document.addEventListener('click', function(e){ if(!e.target.closest('.gallery-suggestions')){ suggestionsBox.style.display='none'; } });

    if(clearBtn){
      clearBtn.addEventListener('click', function(){ input.value = ''; currentQuery=''; currentOffset=0; renderGallery(allData,'',0,pageSize); input.focus(); showSuggestions([]); });
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
