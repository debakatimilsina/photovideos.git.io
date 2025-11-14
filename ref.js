// ref.js - renderer and interactivity for data1Trainees2/data1Trainees3
(function(window){
    // Utility: parse CSV-like string (first line headers)
    function parseCSV(text){
        var lines = text.trim().split(/\r?\n/).filter(Boolean);
        if(lines.length === 0) return {headers:[], rows:[]};
        var headers = lines[0].split(/,\s*/).map(function(h){return h.trim();});
        var rows = lines.slice(1).map(function(line){
            // split but keep commas inside quotes
            var parts = line.match(/(?:"([^"]*)")|([^,]+)/g).map(function(p){return p.replace(/^"|"$/g,'').trim();});
            var obj = {};
            headers.forEach(function(h,i){ obj[h] = parts[i] !== undefined ? parts[i] : ""; });
            return obj;
        });
        return {headers:headers, rows:rows};
    }

    // Function to dynamically generate SN column and fix any manual alterations
    function adjustSN(data){
        var parsed = parseCSV(data);
        if(!parsed.headers.includes("SN")) return data; // No SN column to adjust

        // Ensure SN is the first column and auto-adjust to natural number increments
        var headers = ["SN"].concat(parsed.headers.filter(h => h !== "SN"));
        var updatedRows = parsed.rows.map(function(row, index){
            row.SN = (index + 1).toString(); // Auto-generate SN based on row order
            return headers.map(function(header){ return row[header] || ""; }).join(",");
        });

        return [headers.join(",")].concat(updatedRows).join("\n");
    }

    // Build table into container element
    function buildTable(container, mainDataText, refDataText){
        refDataText = adjustSN(refDataText); // Adjust SN dynamically before building the table
        container.innerHTML = '';
        var parsedMain = parseCSV(mainDataText);
        var parsedRef = parseCSV(refDataText);
        var refMap = {};
        parsedRef.rows.forEach(function(r){ refMap[r.ID] = r.Content; });

        var toolbar = document.createElement('div');
        toolbar.className = 'ref-toolbar';
        var toPlainBtn = document.createElement('button');
        toPlainBtn.textContent = 'Switch to Plain Text';
        toPlainBtn.addEventListener('click', function(){ toPlainText(container, parsedMain, refMap); });
        var refreshBtn = document.createElement('button');
        refreshBtn.textContent = 'Refresh Table View';
        refreshBtn.addEventListener('click', function(){ buildTable(container, mainDataText, refDataText); });
        toolbar.appendChild(toPlainBtn);
        toolbar.appendChild(refreshBtn);
        container.appendChild(toolbar);

        var table = document.createElement('table');
        table.className = 'ref-table';

        // header
        var thead = document.createElement('thead');
        var headerRow = document.createElement('tr');
        parsedMain.headers.forEach(function(h){ var th = document.createElement('th'); th.textContent = h; headerRow.appendChild(th); });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        var tbody = document.createElement('tbody');
        // helper: find reference IDs for a main row (explicit IDs in the value take precedence,
        // otherwise try to match by Name appearing inside the ref content)
        function findRefIdsForRow(val, row){
            var ids = [];
            if(typeof val === 'string'){
                var explicit = (val.match(/\[(\d{2})\]/g) || []).map(function(s){ return s.replace(/\[|\]/g,''); });
                explicit.forEach(function(id){ if(refMap[id] !== undefined) ids.push(id); });
                if(ids.length) return ids;
            }
            if(row.Name){
                var name = row.Name.toLowerCase();
                parsedRef.rows.forEach(function(r){
                    if(r.Content && r.Content.toLowerCase().indexOf(name) !== -1){
                        ids.push(r.ID);
                    }
                });
            }
            return ids;
        }

        parsedMain.rows.forEach(function(row){
            var tr = document.createElement('tr');
            // attach data-sn for reference
            if(row.SN) tr.dataset.sn = row.SN;
            parsedMain.headers.forEach(function(h){
                var td = document.createElement('td');
                var val = row[h] || '';
                // determine reference IDs for this cell (if any)
                var ids = findRefIdsForRow(val, row);
                if(ids && ids.length){
                    td.innerHTML = ids.map(function(id){ return '<a href="#" class="ref-link" data-ref="'+id+'">['+id+']</a>'; }).join(' ');
                } else {
                    // fallback: render raw value (keeping existing bracket markers)
                    td.textContent = val;
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
            // insert a hidden detail row after each main row (will be filled on demand)
            var detailTr = document.createElement('tr');
            detailTr.className = 'ref-detail';
            detailTr.style.display = 'none';
            var detailTd = document.createElement('td');
            detailTd.colSpan = parsedMain.headers.length;
            detailTr.appendChild(detailTd);
            tbody.appendChild(detailTr);
        });

        table.appendChild(tbody);
        container.appendChild(table);

        // attach click handlers for links
        container.querySelectorAll('.ref-link').forEach(function(a){
            a.addEventListener('click', function(ev){
                ev.preventDefault();
                var id = a.dataset.ref;
                toggleDetail(a, id, refMap);
            });
        });
    }

    function toggleDetail(linkEl, id, refMap){
        // find the main row (closest tr) and its next sibling detail row
        var tr = linkEl.closest('tr');
        if(!tr) return;
        var detailTr = tr.nextElementSibling;
        if(!detailTr || !detailTr.classList.contains('ref-detail')) return;
        if(detailTr.style.display === 'none'){
            // fill content
            var content = refMap[id] || ('[No reference found for '+id+']');
            detailTr.firstChild.innerHTML = '<div class="ref-detail-inner"><strong>Ref '+id+':</strong> '+escapeHtml(content)+'</div>';
            detailTr.style.display = '';
        } else {
            detailTr.style.display = 'none';
        }
    }

    function escapeHtml(s){
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    // Convert table view into plain text with endnotes
    function toPlainText(container, parsedMain, refMap){
        container.innerHTML = '';
        var toolbar = document.createElement('div');
        toolbar.className = 'ref-toolbar';
        var backBtn = document.createElement('button');
        backBtn.textContent = 'Back to Table';
        backBtn.addEventListener('click', function(){
            // rebuild by using global variables if present
            if(window.data1Trainees2 && window.data1Trainees3){
                buildTable(container, window.data1Trainees2, window.data1Trainees3);
            }
        });
        toolbar.appendChild(backBtn);
        container.appendChild(toolbar);

        var textDiv = document.createElement('div');
        textDiv.className = 'ref-plaintext';
        // make lines
        parsedMain.rows.forEach(function(row, idx){
            var parts = parsedMain.headers.map(function(h){ return row[h] || ''; });
            // keep ref markers as [01]
            var line = parts.join(' | ');
            var p = document.createElement('p');
            p.textContent = line;
            textDiv.appendChild(p);
        });

        // endnotes
        var notes = document.createElement('div');
        notes.className = 'ref-endnotes';
        var h = document.createElement('h4'); h.textContent = 'Endnotes'; notes.appendChild(h);
        Object.keys(refMap).sort().forEach(function(k){
            var np = document.createElement('p');
            np.innerHTML = '<strong>['+k+']</strong> '+escapeHtml(refMap[k]);
            notes.appendChild(np);
        });

        container.appendChild(textDiv);
        container.appendChild(notes);
    }

    // Public init function — expects `data1Trainees2` and `data1Trainees3` to be loaded as global strings
    window.initTraineeReferences = function(containerId){
        var c = document.getElementById(containerId);
        if(!c) throw new Error('Container not found: '+containerId);
        if(!window.data1Trainees2 || !window.data1Trainees3) {
            c.innerHTML = '<div class="ref-error">Data files not loaded. Make sure data1Trainees2.js and data1Trainees3.js are included.</div>';
            return;
        }
        buildTable(c, window.data1Trainees2, window.data1Trainees3);
    };

})(window);
