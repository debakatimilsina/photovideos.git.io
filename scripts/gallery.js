// scripts/gallery.js
// Virtualized gallery from the CSV string `data2bImages`.
(function(){
  function parseCSV(s){
    if(!s) return [];
    var lines = s.trim().split(/\r?\n/);
    if(lines.length<=1) return [];
    lines.shift(); // drop header
    return lines.map(function(line){
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
  var pageSize = 12;
  var currentOffset = 0;
  var itemHeight = 200; // estimated item height in px
  var bufferRows = 3;

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

  // Virtualized render: compute visible window based on scroll, render only visible items
  function renderGallery(data, query){
    var container = document.getElementById('gallery-container');
    if(!container) return;
    container.innerHTML = '';

    // viewport wrapper
    var viewport = document.createElement('div');
    viewport.className = 'gallery-viewport';
    viewport.style.position = 'relative';
    viewport.style.width = '100%';
    viewport.style.height = Math.max(300, window.innerHeight - 200) + 'px';
    viewport.style.overflow = 'auto';

    // compute columns based on container width and min item width (approx)
    var minItemWidth = 160; // px
    var gap = 10; // matches CSS
    var cols = Math.max(1, Math.floor((container.clientWidth + gap) / (minItemWidth + gap)));
    var totalRows = Math.ceil(data.length / cols);
    var totalHeight = totalRows * itemHeight;

    // spacer to provide scroll height
    var spacer = document.createElement('div');
    spacer.style.height = totalHeight + 'px';
    spacer.style.position = 'relative';

    viewport.appendChild(spacer);
    container.appendChild(viewport);

    var rendered = document.createElement('div');
    rendered.className = 'gallery-rendered';
    rendered.style.position = 'absolute';
    rendered.style.left = '0';
    rendered.style.top = '0';
    rendered.style.width = '100%';
    spacer.appendChild(rendered);

    function paint(){
      var scrollTop = viewport.scrollTop;
      var vh = viewport.clientHeight;
      var firstVisibleRow = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferRows);
      var lastVisibleRow = Math.min(totalRows -1, Math.ceil((scrollTop + vh) / itemHeight) + bufferRows);
      var startIndex = firstVisibleRow * cols;
      var endIndex = Math.min(data.length, (lastVisibleRow+1) * cols);

      rendered.innerHTML = '';
      for(var i=startIndex;i<endIndex;i++){
        var item = data[i];
        if(!item) continue;
        var row = Math.floor(i/cols);
        var col = i % cols;

        var itemWrap = document.createElement('div');
        itemWrap.className = 'gallery-item';
        itemWrap.style.position = 'absolute';
        itemWrap.style.boxSizing = 'border-box';
        var percentLeft = (100/cols) * col;
        itemWrap.style.left = percentLeft + '%';
        itemWrap.style.width = (100/cols) + '%';
        itemWrap.style.top = (row * itemHeight) + 'px';
        itemWrap.style.padding = '6px';

        var img = document.createElement('img');
        img.src = item.Image || '';
        img.alt = item.Title || item.ID || '';
        img.className = 'expandable-img';
        img.setAttribute('data-fullsrc', item.Image || '');
        img.loading = 'lazy';
        img.style.width = '100%';
        img.style.height = (itemHeight - 60) + 'px';
        img.style.objectFit = 'cover';

        var caption = document.createElement('div');
        caption.className = 'gallery-caption';
        caption.style.padding = '6px 4px';
        var title = document.createElement('span');
        title.className = 'title';
        var desc = document.createElement('span');
        desc.className = 'desc';
        title.innerHTML = highlight(item.Title || item.ID || '', query);
        desc.innerHTML = highlight(item.Description || '', query);
        caption.appendChild(title);
        if((item.Description||'').trim()) caption.appendChild(desc);

        itemWrap.appendChild(img);
        itemWrap.appendChild(caption);
        rendered.appendChild(itemWrap);
      }
    }

    // initial paint
    paint();
    var raf;
    viewport.addEventListener('scroll', function(){
      if(raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(paint);
    });
    window.addEventListener('resize', debounce(function(){ renderGallery(data, query); }, 200));
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
      if(!q){ currentOffset=0; renderGallery(allData,''); showSuggestions([]); return; }
      var ql = q.toLowerCase();
      var filtered = allData.filter(function(it){
        var hay = ((it.Title||'') + ' ' + (it.Description||'')).toLowerCase();
        return hay.indexOf(ql) !== -1;
      });
      currentOffset = 0;
      renderGallery(filtered, q);

      // show suggestions matching start of words
      var sugg = suggestionsIndex.filter(function(s){ return s.toLowerCase().indexOf(ql) !== -1; }).slice(0,10);
      showSuggestions(sugg);
    }, 150);
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', function(e){ if(e.key==='Escape'){ suggestionsBox.style.display='none'; } });
    document.addEventListener('click', function(e){ if(!e.target.closest('.gallery-suggestions')){ suggestionsBox.style.display='none'; } });

    if(clearBtn){
      clearBtn.addEventListener('click', function(){ input.value = ''; currentQuery=''; currentOffset=0; renderGallery(allData,''); input.focus(); showSuggestions([]); });
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    try{
      allData = parseCSV(window.data2bImages);
      renderGallery(allData,'');
      setupSearch();
    }catch(e){
      console.warn('gallery build failed', e);
    }
  });
})();
