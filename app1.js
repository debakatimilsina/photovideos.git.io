// app1.js - Core Class Structure and Initialization
class DataApp {
    constructor() {
        this.currentDataset = 'data3Links';
        this.originalData = {};
        this.filteredData = {};
        this.headers = {};
        this.datasetInfo = {};
        this.searchTerm = '';
        this.sqlQuery = '';
        this.showMultipleDatasets = false;
        this.sqlFilterExpanded = false;
        this.simpleConditions = [];
        this.activeFilterTab = 'simple';
        this.selectedColumns = {}; // Track selected columns per dataset
        this.showColumnSelector = false; // Toggle column selector visibility
        this.searchMode = 'search1'; // 'search1' = filter, 'search2' = highlight only
        
        this.init();
    }

    init() {
        this.loadData();
        // Initialize selected columns for each dataset
        Object.keys(this.headers).forEach(dataset => {
            this.selectedColumns[dataset] = [...this.headers[dataset]]; // Default to all columns
        });
        this.render();
        this.attachEvents();
        window.searchEngine.initStickySearch();
        this.applyFiltersToCurrentDataset();
    }

    loadData() {
    const datasets = ['data3Links', 'data1Trainees','data1Trainees2','data1Trainees3','data4Status','data5Url1', 'data5Url2','data2Images','data2bImages','data6IMAGESS','data9Videos1'];
        
        datasets.forEach(dataset => {
            if (window[dataset]) {
                this.originalData[dataset] = this.parseCSV(window[dataset]);
                this.headers[dataset] = Object.keys(this.originalData[dataset][0] || {});
                
                const infoVar = dataset + 'Info';
                if (window[infoVar]) {
                    this.datasetInfo[dataset] = window[infoVar];
                }
            }
        });
        
        this.filteredData = JSON.parse(JSON.stringify(this.originalData));
    }

    parseCSV(csvString) {
        const lines = csvString.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        return lines.slice(1).map(line => {
            const values = this.parseCSVLine(line);
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = (values[index] || '').trim();
            });
            return obj;
        });
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    switchDataset(dataset) {
        this.currentDataset = dataset;
        this.simpleConditions = [];
        this.sqlQuery = '';
        this.applyFiltersToCurrentDataset();
        this.render();
    }

    toggleMultipleDatasets() {
        this.showMultipleDatasets = !this.showMultipleDatasets;
        if (this.showMultipleDatasets) {
            this.applyFiltersToAllDatasets();
        } else {
            this.applyFiltersToCurrentDataset();
        }
        this.render();
    }

    toggleSQLFilter() {
        this.sqlFilterExpanded = !this.sqlFilterExpanded;
        this.render();
    }

    toggleFilterTab(tab) {
        this.activeFilterTab = tab;
        this.render();
    }

    toggleColumnSelector() {
        this.showColumnSelector = !this.showColumnSelector;
        this.render();
    }

    updateSelectedColumns(column, isChecked) {
        const currentColumns = this.selectedColumns[this.currentDataset];
        if (isChecked && !currentColumns.includes(column)) {
            currentColumns.push(column);
        } else if (!isChecked) {
            this.selectedColumns[this.currentDataset] = currentColumns.filter(c => c !== column);
        }
        this.render();
    }

    toggleSearchMode() {
        this.searchMode = this.searchMode === 'search1' ? 'search2' : 'search1';
        if (this.showMultipleDatasets) {
            this.applyFiltersToAllDatasets();
        } else {
            this.applyFiltersToCurrentDataset();
        }
        this.render();
    }
}