// CÁLCULOS DE DATA E SLA
    // =========================================================================
    function getElapsedTime(startDateStr) {
      var start = parseDateBR(startDateStr);
      if (!start || isNaN(start.getTime())) return '-';
      var now = new Date();
      var diffMs = Math.max(0, now - start);
      var mins = Math.floor(diffMs / 60000);
      var hours = Math.floor(mins / 60);
      var days = Math.floor(hours / 24);
      if (days > 0) return days + 'd ' + (hours % 24) + 'h';
      if (hours > 0) return hours + 'h ' + (mins % 60) + 'm';
      return mins + 'm';
    }

    function isManualReturnPastDue(returnDateStr) {
      var clean = formatOnlyDateBR(returnDateStr);
      if (!clean || clean === 'A definir' || clean.indexOf('/') === -1) return false;
      var parts = clean.split('/');
      var end = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 23, 59, 59, 999);
      return end.getTime() < Date.now();
    }
    function getRemainingTime(returnDateStr) {
      var cleanStr = formatOnlyDateBR(returnDateStr);
      if (!cleanStr || cleanStr === "A definir") return { text: "Sem Prazo", "class": "", isUrgent: false };
      var target = null;
      if (cleanStr.indexOf('/') !== -1) {
        var parts = cleanStr.split('/');
        target = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10), 23, 59);
      }
      if (!target || isNaN(target.getTime())) return { text: "Sem Prazo", "class": "", isUrgent: false };

      var now = new Date();
      var diffMs = target - now;

      if (diffMs < 0) {
        var lateDays = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
        return { text: "Atrasado " + lateDays + "d", "class": "late", isUrgent: true };
      }
      var remHours = Math.floor(diffMs / (1000 * 60 * 60));
      var remDays = Math.floor(remHours / 24);
      if (remDays === 0) return { text: "Vence Hoje", "class": "today", isUrgent: true };
      return { text: "Faltam " + remDays + "d", "class": "", isUrgent: false };
    }

    function calcMedian(vals) {
      if (!vals || vals.length === 0) return 0;
      var sorted = vals.slice().sort(function(a, b) { return a - b; });
      var mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : ((sorted[mid - 1] + sorted[mid]) / 2);
    }

    function calcCurrentSlaStats(useBiFilters) {
      var completed = useBiFilters && typeof getBiFilteredTickets === 'function' ? getBiFilteredTickets('Concluído').filter(function(t) { return t.durationDays !== null; }) : allTickets.filter(function(t) { return t.status === 'Concluído' && t.durationDays !== null; });
      var map = {};
      var defaultServices = ['Contestação', 'Chamado T.I', 'Layout XML', 'Isenção', 'Logistica', 'Cancelamento', 'Cobrança fora da TAG', 'Outros'];
      defaultServices.forEach(function(s) {
        map[s] = { count: 0, sum: 0, vals: [], mean: 0, median: 0 };
      });
      completed.forEach(function(t) {
        var s = String(t.solicitacao || 'Outros');
        var productKey = normalizeProduct(t.product) + '|' + s;
        [s, productKey].forEach(function(key) {
          if (!map[key]) map[key] = { count: 0, sum: 0, vals: [], mean: 0, median: 0 };
          var dur = parseFloat(t.durationDays);
          if (!isNaN(dur)) {
            map[key].count++;
            map[key].sum += dur;
            map[key].vals.push(dur);
          }
        });
      });
      Object.keys(map).forEach(function(s) {
        if (map[s].count > 0) {
          map[s].mean = (map[s].sum / map[s].count).toFixed(1);
          map[s].median = calcMedian(map[s].vals).toFixed(1);
        }
      });
      return map;
    }

    function calcProductSlaStats() {
      var completed = allTickets.filter(function(t) { return t.status === 'Concluído' && t.durationDays !== null; });
      var map = {
        'PEDÁGIO': { count: 0, sum: 0, vals: [], mean: 0, median: 0 },
        'ABASTECIMENTO': { count: 0, sum: 0, vals: [], mean: 0, median: 0 },
        'MANUTENÇÃO': { count: 0, sum: 0, vals: [], mean: 0, median: 0 }
      };
      completed.forEach(function(t) {
        var p = normalizeProduct(t.product);
        if (map[p]) {
          var dur = parseFloat(t.durationDays);
          if (!isNaN(dur)) {
            map[p].count++;
            map[p].sum += dur;
            map[p].vals.push(dur);
          }
        }
      });
      Object.keys(map).forEach(function(p) {
        if (map[p].count > 0) {
          map[p].mean = (map[p].sum / map[p].count).toFixed(1);
          map[p].median = calcMedian(map[p].vals).toFixed(1);
        }
      });
      return map;
    }

    function getSlaGradientColors(days) {
      var val = parseFloat(days);
      if (isNaN(val)) return { color: "#9BA1B0", bg: "rgba(155,161,176,0.15)", border: "rgba(155,161,176,0.3)", pct: 0 };
      
      var r, g, b;
      if (val <= 5) {
        r = 0; g = 214; b = 89;
      } else if (val <= 12) {
        var t1 = (val - 5) / 7;
        r = Math.round(0 + t1 * 245);
        g = Math.round(214 + t1 * (158 - 214));
        b = Math.round(89 + t1 * (11 - 89));
      } else {
        var t2 = Math.min(1, (val - 12) / 10);
        r = Math.round(245 + t2 * (239 - 245));
        g = Math.round(158 + t2 * (68 - 158));
        b = Math.round(11 + t2 * (68 - 11));
      }
      var rgb = r + "," + g + "," + b;
      var pct = Math.min(100, Math.max(8, (val / 35) * 100));
      return {
        color: "rgb(" + rgb + ")",
        bg: "rgba(" + rgb + ", 0.16)",
        border: "rgba(" + rgb + ", 0.42)",
        pct: pct
      };
    }

    function toggleSidebar() {
      document.body.classList.toggle('sidebar-collapsed');
      var collapsed = document.body.classList.contains('sidebar-collapsed');
      var icon = document.getElementById('sidebarToggleIcon');
      if (icon) icon.textContent = collapsed ? '›' : '‹';
      var label = document.querySelector('.sidebar-toggle-label');
      if (label) label.textContent = collapsed ? 'Expandir menu' : 'Recolher menu';
    }

    function toggleTheme() {
      var light = document.body.classList.toggle('theme-light');
      var icon = document.getElementById('themeToggleIcon');
      if (icon) icon.textContent = light ? '☾' : '☀';
      var button = document.getElementById('themeToggle');
      if (button) { button.title = light ? 'Ativar tema escuro' : 'Ativar tema claro'; button.setAttribute('aria-label', button.title); }
      try { localStorage.setItem('backoffice-theme', light ? 'light' : 'dark'); } catch(e) {}
    }
    function initTheme() {
      try { if (localStorage.getItem('backoffice-theme') === 'light') { document.body.classList.add('theme-light'); var icon = document.getElementById('themeToggleIcon'); if (icon) icon.textContent = '☾'; } } catch(e) {}
    }
    initTheme();

    function switchMainTab(tab) {
      document.getElementById('viewPaneQueue').style.display = tab === 'queue' ? 'block' : 'none';
      document.getElementById('viewPaneRecords').style.display = tab === 'records' ? 'block' : 'none';
      document.getElementById('viewPaneReport').style.display = tab === 'report' ? 'block' : 'none';
      var projectionPane = document.getElementById('viewPaneProjection'); if (projectionPane) projectionPane.style.display = tab === 'projection' ? 'block' : 'none';
      ['Queue','Records','Report','Projection'].forEach(function(key) {
        var button = document.getElementById('btnTab' + key);
        if (button) button.classList.toggle('active', (key === 'Queue' && tab === 'queue') || (key === 'Records' && tab === 'records') || (key === 'Report' && tab === 'report') || (key === 'Projection' && tab === 'projection'));
      });
      var actions = document.getElementById('operationalTopbarActions');
      if (actions) actions.style.display = tab === 'queue' ? 'flex' : 'none';
      if (tab === 'report') renderSlaReport();
      if (tab === 'projection') renderSlaProjection();
    }

    function toggleOverdueFilter() {
      filterOnlyOverdue = !filterOnlyOverdue;
      var box = document.getElementById('kpiOverdueBox');
      if (box) {
        if (filterOnlyOverdue) box.classList.add('active-kpi');
        else box.classList.remove('active-kpi');
      }
      renderAll();
    }


    var openSortMode = 'oldest';
    function toggleOpenSortMode() {
      openSortMode = openSortMode === 'oldest' ? 'newest' : 'oldest';
      var btn = document.getElementById('openSortToggle');
      if (btn) {
        btn.innerText = openSortMode === 'oldest' ? '↑ Mais antigas' : '↓ Mais recentes';
        btn.setAttribute('aria-label', openSortMode === 'oldest' ? 'Ordenar demandas mais antigas primeiro' : 'Ordenar demandas mais recentes primeiro');
      }
      renderAll();
    }

    function toggleAdvancedFilters() {
      var panel = document.getElementById('advancedFiltersPanel');
      var button = document.getElementById('advancedFiltersToggle');
      if (!panel || !button) return;
      var opening = panel.style.display === 'none' || !panel.style.display;
      panel.style.display = opening ? 'flex' : 'none';
      button.setAttribute('aria-expanded', opening ? 'true' : 'false');
      button.innerHTML = opening ? 'Mais filtros <span>⌃</span>' : 'Mais filtros <span>⌄</span>';
    }

    function clearFilters() {
      filterOnlyOverdue = false;
      var box = document.getElementById('kpiOverdueBox');
      if (box) box.classList.remove('active-kpi');
      if (document.getElementById('filterMonthSelect')) document.getElementById('filterMonthSelect').value = '11-2026';
      if (document.getElementById('filterAgentSelect')) document.getElementById('filterAgentSelect').value = '';
      if (document.getElementById('filterProductSelect')) document.getElementById('filterProductSelect').value = '';
      if (document.getElementById('filterServiceSelect')) document.getElementById('filterServiceSelect').value = '';
      if (document.getElementById('filterThirdSelect')) document.getElementById('filterThirdSelect').value = '';
      if (document.getElementById('searchInput')) document.getElementById('searchInput').value = '';
      openSortMode = 'oldest';
      var sortButton = document.getElementById('openSortToggle');
      if (sortButton) sortButton.innerText = '↑ Mais antigas';
      renderAll();
    }


    function clearRecordsFilters() {
      ['recordsSearch','recordsProduct','recordsService','recordsThird','recordsAgent','recordsFrom','recordsTo'].forEach(function(id) { var el=document.getElementById(id); if(el) el.value=''; });
      renderAll();
    }

    function exportArchivedCSV() {
      var archived = allTickets.filter(function(t) { return t.status === 'Concluído'; });
      if (archived.length === 0) {
        showToast("Não existem demandas finalizadas para exportar.", true);
        return;
      }
      var headers = ['Mês', 'Data Registro', 'Data Conclusão', 'Cliente', 'Produto', 'Solicitação', 'Terceiro', 'Casa DAF', 'SLA Final (Dias)', 'Agente'];
      var rows = [headers.join(';')];
      archived.forEach(function(t) {
        rows.push([ t.mes, t.startDate, t.endDate || formatOnlyDateBR(t.returnDate), '"' + (t.client || '') + '"', t.product, t.solicitacao, '"' + (t.terceiro || '') + '"', '"' + (t.dafRede || '') + '"', t.durationDays !== null ? t.durationDays : '', t.operator ].join(';'));
      });
      var blob = new Blob(["\uFEFF" + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = "Demandas_Finalizadas_TruckPag.csv";
      a.click();
      showToast("Arquivo CSV exportado com sucesso!");
    }

    // =========================================================================
    // RENDERIZAÇÃO: KPIS, COLUNAS E TABELA
    // =========================================================================
    function renderAll() {
      var monthVal = document.getElementById('filterMonthSelect') ? document.getElementById('filterMonthSelect').value : '11-2026';
      var agent = document.getElementById('filterAgentSelect') ? document.getElementById('filterAgentSelect').value : '';
      var prod = document.getElementById('filterProductSelect') ? document.getElementById('filterProductSelect').value : '';
      var serv = document.getElementById('filterServiceSelect') ? document.getElementById('filterServiceSelect').value : '';
      var third = document.getElementById('filterThirdSelect') ? document.getElementById('filterThirdSelect').value : '';
      var search = document.getElementById('searchInput') ? (document.getElementById('searchInput').value || '').toLowerCase().trim() : '';

      var th = document.getElementById('thMonthOrDate');
      if (th) th.innerText = monthVal ? 'Data de Registro' : 'Mês / Data';

      function matchFilters(t) {
        var m = normalizeMes(t.mes);
        if (monthVal && m !== monthVal) return false;
        if (agent && t.operator !== agent) return false;
        if (prod && normalizeProduct(t.product) !== prod) return false;
        if (serv && t.solicitacao !== serv) return false;
        if (third && getTicketThird(t) !== third) return false;
        if (search) {
          var s = (String(t.client || "") + " " + String(t.contact || "") + " " + String(t.solicitacao || "") + " " + String(getTicketThird(t) || "") + " " + String(t.dafRede || "") + " " + String(t.description || "")).toLowerCase();
          if (s.indexOf(search) === -1) return false;
        }
        return true;
      }

      var filteredTickets = allTickets.filter(matchFilters);

      var allOpen = filteredTickets.filter(function(t) { return t.status === 'Em andamento'; });
      var urgentCount = 0;
      allOpen.forEach(function(t) {
        var officialDeadline = getOfficialDeadline(t);
        var manualReturn = t.solicitacao === 'Isenção' && t.returnDate && t.returnDate !== 'A definir';
        var target = officialDeadline || (manualReturn ? t.returnDate : '');
        if (target && (manualReturn ? isManualReturnPastDue(target) : getRemainingTime(target).isUrgent)) urgentCount++;
      });
      var onTimeCount = allOpen.filter(function(t) {
        var due = getOfficialDeadline(t);
        var manualReturn = t.solicitacao === 'Isenção' && t.returnDate && t.returnDate !== 'A definir';
        var target = due || (manualReturn ? t.returnDate : '');
        return !!target && (manualReturn ? !isManualReturnPastDue(target) : !getRemainingTime(target).isUrgent);
      }).length;

      var allDone = filteredTickets.filter(function(t) { return t.status === 'Concluído' && t.durationDays !== null; });

      if (document.getElementById('kpiTotalOpen')) document.getElementById('kpiTotalOpen').innerText = allOpen.length;
      if (document.getElementById('kpiOnTime')) document.getElementById('kpiOnTime').innerText = onTimeCount;
      if (document.getElementById('kpiOverdue')) document.getElementById('kpiOverdue').innerText = urgentCount;
      if (document.getElementById('kpiOverdueSub')) {
        document.getElementById('kpiOverdueSub').innerText = filterOnlyOverdue ? "Ativo" : "Filtrar";
      }
      if (document.getElementById('kpiFinalizedMonth')) document.getElementById('kpiFinalizedMonth').innerText = allDone.length;

      var inProg = allOpen.filter(function(t) {
        var officialDeadline = getOfficialDeadline(t);
        var manualReturn = t.solicitacao === 'Isenção' && t.returnDate && t.returnDate !== 'A definir';
        var target = officialDeadline || (manualReturn ? t.returnDate : '');
        if (filterOnlyOverdue && (!target || !(manualReturn ? isManualReturnPastDue(target) : getRemainingTime(target).isUrgent))) return false;
        return true;
      });

      var lbl = document.getElementById('inProgressCountLabel');
      if (lbl) lbl.innerText = '';

      var abastTickets = inProg.filter(function(t) { return normalizeProduct(t.product) === 'ABASTECIMENTO'; });
      var pedTickets = inProg.filter(function(t) { return normalizeProduct(t.product) === 'PEDÁGIO'; });
      var manutTickets = inProg.filter(function(t) { return normalizeProduct(t.product) === 'MANUTENÇÃO'; });

      if (document.getElementById('countColAbast')) document.getElementById('countColAbast').innerText = abastTickets.length;
      if (document.getElementById('countColPed')) document.getElementById('countColPed').innerText = pedTickets.length;
      if (document.getElementById('countColManut')) document.getElementById('countColManut').innerText = manutTickets.length;

      renderProductCardsColumn('colCardsAbast', abastTickets, 'prod-abastecimento');
      renderProductCardsColumn('colCardsPed', pedTickets, 'prod-pedagio');
      renderProductCardsColumn('colCardsManut', manutTickets, 'prod-manutencao');

      var finalizedLbl = document.getElementById('finalizedCountLabel');
      if (finalizedLbl) finalizedLbl.innerText = allDone.length + ' demandas finalizadas';

      var recordsAgentSelect = document.getElementById('recordsAgent');
      if (recordsAgentSelect && recordsAgentSelect.options.length <= 1) {
        Array.from(new Set(allTickets.map(function(t){return t.operator;}).filter(Boolean))).sort().forEach(function(op){ var opt=document.createElement('option'); opt.value=op; opt.textContent=op; recordsAgentSelect.appendChild(opt); });
      }
      var tbody = document.getElementById('recordsTableBody');
      if (!tbody) return;
      tbody.innerHTML = '';
      var recSearch = (document.getElementById('recordsSearch')?.value || '').toLowerCase().trim();
      var recProduct = document.getElementById('recordsProduct')?.value || '';
      var recService = document.getElementById('recordsService')?.value || '';
      var recThird = document.getElementById('recordsThird')?.value || '';
      var recAgent = document.getElementById('recordsAgent')?.value || '';
      var recFrom = document.getElementById('recordsFrom')?.value || '';
      var recTo = document.getElementById('recordsTo')?.value || '';
      var recordsDone = allTickets.filter(function(t) {
        if (t.status !== 'Concluído') return false;
        if (recProduct && normalizeProduct(t.product) !== recProduct) return false;
        if (recService && getDisplaySolicitation(t) !== recService) return false;
        if (recThird && getTicketThird(t) !== recThird) return false;
        if (recAgent && (t.operator || '') !== recAgent) return false;
        var d = parseDateBR(t.endDate || t.returnDate || t.startDate);
        if (recFrom && (!d || d < new Date(recFrom + 'T00:00:00'))) return false;
        if (recTo && (!d || d > new Date(recTo + 'T23:59:59'))) return false;
        if (recSearch) {
          var hay = [t.client,t.contact,t.solicitacao,t.product,t.terceiro,t.operator,t.description,t.dafRede].join(' ').toLowerCase();
          if (hay.indexOf(recSearch) === -1) return false;
        }
        return true;
      }).sort(function(a,b) { return (parseDateBR(b.endDate || b.returnDate || b.startDate) || 0) - (parseDateBR(a.endDate || a.returnDate || a.startDate) || 0); });
      if (document.getElementById('finalizedCountLabel')) document.getElementById('finalizedCountLabel').innerText = recordsDone.length + ' demandas finalizadas';
      if (recordsDone.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding:22px; color:var(--text-subtle);">Nenhuma demanda finalizada para os filtros selecionados.</td></tr>';
        return;
      }

      recordsDone.forEach(function(r) {
        try {
          var tr = document.createElement('tr');
          tr.onclick = function() { openDrawer(r); };
          
          var displayStart = formatDateDisplay(r.startDate);
          var displayEnd = formatDateDisplay(r.endDate || formatOnlyDateBR(r.returnDate) || r.startDate);
          var slaText = r.durationDays !== null ? r.durationDays + 'd' : '-';

          var tdDate = document.createElement('td');
          tdDate.style.cssText = 'font-family:monospace; font-weight:700; color:#E2E8F0;';
          tdDate.textContent = monthVal ? displayStart : r.mes;

          var tdEnd = document.createElement('td');
          tdEnd.style.cssText = 'font-family:monospace; color:#A7F3D0;';
          tdEnd.textContent = displayEnd;

          var tdClient = document.createElement('td');
          tdClient.style.cssText = 'font-weight:800; color:#fff;';
          tdClient.textContent = r.client || '-';

          
var tdProd = document.createElement('td');
var prodStr = normalizeProduct(r.product);
var prodClass = prodStr === 'PEDÁGIO' ? 'badge-ped' : (prodStr === 'ABASTECIMENTO' ? 'badge-aba' : (prodStr === 'MANUTENÇÃO' ? 'badge-man' : ''));
tdProd.innerHTML = '<span class="badge-product ' + prodClass + '">' + prodStr + '</span>';


          var tdSol = document.createElement('td');
          tdSol.textContent = getDisplaySolicitation(r);

          var tdTerc = document.createElement('td');
          tdTerc.style.cssText = 'color:#38BDF8; font-weight:700;';
          tdTerc.textContent = getTicketThird(r) || '-';

          var tdSla = document.createElement('td');
          tdSla.innerHTML = '<span style="font-size:11px; font-weight:800; color:var(--tp-green); background:rgba(0,214,89,0.14); padding:2px 7px; border-radius:4px;">✓ ' + escapeHtml(slaText) + '</span>';

          var historical = allTickets.filter(function(x) { return x.status === 'Concluído' && normalizeProduct(x.product) === normalizeProduct(r.product) && getDisplaySolicitation(x) === getDisplaySolicitation(r) && x.durationDays !== null && x.durationDays !== undefined && x.durationDays !== ''; }).map(function(x) { return Number(x.durationDays); }).filter(function(v) { return isFinite(v) && v >= 0; });
          var historicalAvg = historical.length ? historical.reduce(function(a,b) { return a+b; }, 0) / historical.length : null;
          var official = getFixedPartnerSla(r.product, r.solicitacao);
          var tdHistorical = document.createElement('td'); tdHistorical.textContent = historicalAvg === null ? '—' : historicalAvg.toFixed(1).replace('.', ',') + ' dias';
          var tdOfficial = document.createElement('td'); tdOfficial.innerHTML = official ? '<strong>' + official + ' dias ' + (r.solicitacao === 'Cobrança fora da TAG' ? 'úteis' : 'corridos') + '</strong>' : '<span style="color: var(--text-muted); font-size: 11px;">Sem prazo</span>';

          var tdOp = document.createElement('td');
          tdOp.style.cssText = 'color:var(--text-muted); font-weight:600;';
          tdOp.textContent = r.operator || '-';

          var tdAct = document.createElement('td');
          tdAct.style.cssText = 'text-align:center; white-space:nowrap;';
          tdAct.onclick = function(e) { e.stopPropagation(); };
          var editBtn = document.createElement('button');
          editBtn.className = 'btn-row-edit';
          editBtn.innerHTML = '✎ Editar';
          editBtn.onclick = function(e) { editTicketById(e, r.id); };
          var delBtn = document.createElement('button');
          delBtn.className = 'btn-row-delete';
          delBtn.textContent = 'Excluir';
          delBtn.onclick = function(e) { deleteTicketById(e, r.id); };
          tdAct.appendChild(editBtn);
          tdAct.appendChild(delBtn);

          tr.appendChild(tdDate);
          tr.appendChild(tdEnd);
          tr.appendChild(tdClient);
          tr.appendChild(tdProd);
          tr.appendChild(tdSol);
          tr.appendChild(tdTerc);
          tr.appendChild(tdSla);
          tr.appendChild(tdHistorical);
          tr.appendChild(tdOfficial);
          tr.appendChild(tdOp);
          tr.appendChild(tdAct);

          tbody.appendChild(tr);
        } catch(errRow) {
          console.warn("Erro ao renderizar linha finalizada:", errRow);
        }
      });
    }

    function getTicketSlaRisk(ticket) {
      var officialDays = getFixedPartnerSla(ticket.product, ticket.solicitacao);
      if (!officialDays) return { mean: 0, elapsedDays: 0, ratio: 0, percent: 0, level: 'risk-unknown', label: '' };
      var start = parseDateBR(ticket.startDate);
      var elapsedDays = start ? (ticket.solicitacao === 'Cobrança fora da TAG' ? countBusinessDays(start, new Date()) : Math.max(0, (Date.now() - start.getTime()) / 86400000)) : 0;
      var ratio = officialDays > 0 ? elapsedDays / officialDays : 0;
      var level = ratio >= 1 ? 'risk-red' : (ratio >= 0.75 ? 'risk-yellow' : 'risk-green');
      var label = level === 'risk-red' ? 'Prazo vencido' : (level === 'risk-yellow' ? 'Próximo do prazo' : 'Dentro do prazo');
      return { mean: officialDays, elapsedDays: elapsedDays, ratio: ratio, percent: Math.min(100, Math.max(0, ratio * 100)), level: level, label: label };
    }

    function renderProductCardsColumn(containerId, list, prodClass) {
      var container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = '';
      if (list.length === 0) {
        container.innerHTML = '<div class="empty-column-state">Nenhuma demanda em aberto neste produto.</div>';
        return;
      }
      list = list.slice().sort(function(a, b) {
        var da = parseDateBR(a.startDate), db = parseDateBR(b.startDate);
        var ta = da ? da.getTime() : 0, tb = db ? db.getTime() : 0;
        return openSortMode === 'newest' ? tb - ta : ta - tb;
      });
      list.forEach(function(t) {
        try {
          var elapsed = getElapsedTime(t.startDate);
          var openedAt = formatDateDisplay(t.startDate);
          var partnerDays = getFixedPartnerSla(t.product, t.solicitacao);
          var deadline = getOfficialDeadline(t);
          var deadlineStatus = partnerDays ? getRemainingTime(deadline) : null;
          var risk = getTicketSlaRisk(t);
          var card = document.createElement('button');
          card.type = 'button';
          card.className = 'progress-card ' + prodClass + ' card-readable';
          card.setAttribute('aria-label', 'Abrir demanda de ' + String(t.client || 'cliente') + ', ' + String(t.solicitacao || 'solicitação'));
          card.onclick = function() { openDrawer(t); };
          var isExemption = t.solicitacao === 'Isenção' && (normalizeProduct(t.product) === 'PEDÁGIO' || normalizeProduct(t.product) === 'ABASTECIMENTO');
          var returnStatus = isExemption ? getRemainingTime(t.returnDate) : null;
          
          
          var deadlineHtml = partnerDays ?
            '<div class="card-metric card-official"><span class="card-metric-label">Prazo oficial (' + partnerDays + 'd)</span><strong class="card-metric-value">' + escapeHtml(deadline) + '</strong><span class="card-deadline-state ' + deadlineStatus.class + '">' + escapeHtml(deadlineStatus.text) + '</span></div>' :
            (isExemption && t.returnDate && t.returnDate !== 'A definir' ? 
            '<div class="card-metric card-finance-return"><span class="card-metric-label">Retorno Financeiro</span><strong class="card-metric-value">' + escapeHtml(formatDateDisplay(t.returnDate)) + '</strong><span class="card-deadline-state ' + returnStatus.class + '">' + (returnStatus.text === 'Vence Hoje' ? 'Retorno hoje' : escapeHtml(returnStatus.text)) + '</span></div>' : 
            '<div class="card-no-official-note">Sem prazo definido.</div>');
          
          var riskPill = partnerDays ? '<span class="card-priority-dot ' + risk.level + '"></span>' : '';
          
          card.innerHTML =
            '<div class="card-readable-head">' + riskPill + '<div class="card-client-title" title="' + escapeHtml(t.client) + '">' + escapeHtml(t.client || 'Sem cliente') + '</div><span class="card-agent-pill">' + escapeHtml(t.operator || '') + '</span></div>' +
            '<div class="card-readable-service"><span>' + escapeHtml(getDisplaySolicitation(t)) + '</span><span class="card-third-label">' + escapeHtml(getTicketThird(t)) + '</span></div>' +
            '<div class="card-metrics-grid">' +
              '<div class="card-metric"><span class="card-metric-label">Aberto em</span><strong class="card-metric-value">' + escapeHtml(openedAt || 'Não informada') + '</strong></div>' +
              '<div class="card-metric"><span class="card-metric-label">Em aberto</span><strong class="card-metric-value card-elapsed-value">' + escapeHtml(elapsed) + '</strong></div>' +
              deadlineHtml +
            '</div>';

container.appendChild(card);
        } catch(errCard) { console.warn('Erro ao renderizar card:', errCard); }
      });
    }

    function exportFullBackup() {
      try {
        var backup = { application: 'TruckPag BackOffice', backupVersion: 1, exportedAt: new Date().toISOString(), tickets: allTickets, deletedIds: getDeletedIds(), pendingOperations: getPendingOps() };
        var blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = 'truckpag-backup-' + new Date().toISOString().slice(0,10) + '.json';
        document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
        showToast('Backup local gerado. Guarde o arquivo em local seguro.');
      } catch (err) { console.error('Falha ao gerar backup:', err); showToast('Não foi possível gerar o backup. Verifique o navegador.', true); }
    }

    function buildCustomerOpeningMessage(ticket) {
      var client = String(ticket.client || 'cliente').trim();
      var plateMatch = String(ticket.description || '').match(/placa\\s*[:=-]?\\s*([A-Z0-9-]{6,8})/i);
      var plate = plateMatch ? plateMatch[1].toUpperCase() : '[PLACA]';
      return 'Olá, ' + client + '!\\n\\nSua solicitação já foi encaminhada à Move Mais. Solicitamos a inclusão na TAG das passagens que permanecem em aberto, vinculadas à placa ' + plate + '.\\n\\nO prazo de retorno informado pelo parceiro é de até 10 dias úteis. Assim que recebermos uma atualização, entraremos em contato diretamente por este canal.\\n\\nAgradecemos pela compreensão e permanecemos à disposição!';
    }

    function copyCustomerOpeningMessage() {
      var text = document.getElementById('drawerCustomerMessageText');
      if (!text) return;
      var message = text.innerText || text.textContent || '';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(message).then(function() { showToast('Mensagem copiada para a área de transferência!'); }).catch(function() { showToast('Não foi possível copiar automaticamente. Selecione o texto e copie.', true); });
      } else {
        showToast('Seu navegador não permite cópia automática neste contexto. Selecione o texto e copie.', true);
      }
    }

    // =========================================================================
    // DRAWER LATERAL & PRODUTIVIDADE
    // =========================================================================
    function openDrawer(ticket, keepViewMode) {
      if (!ticket) return;
      activeSelectedTicket = ticket;

      if (!keepViewMode) {
        var editForm = document.getElementById('drawerEditForm');
        if (editForm) editForm.style.display = 'none';
        var detailGrid = document.getElementById('drawerDetailGrid');
        if (detailGrid) detailGrid.style.display = 'grid';
      }

      try {
        document.getElementById('drawerClientTitle').innerText = String(ticket.client || "Cliente");
        
        var prodNorm = normalizeProduct(ticket.product);
        var badgeEl = document.getElementById('drawerProductBadge');
        badgeEl.innerText = prodNorm;
        badgeEl.className = 'badge-product ' + (prodNorm === 'PEDÁGIO' ? 'badge-ped' : (prodNorm === 'ABASTECIMENTO' ? 'badge-aba' : (prodNorm === 'MANUTENÇÃO' ? 'badge-man' : '')));

        document.getElementById('drawerSolicitationBadge').innerText = getDisplaySolicitation(ticket);
        document.getElementById('drawerStatusVal').innerText = String(ticket.status || "-");
        document.getElementById('drawerAgentVal').innerText = String(ticket.operator || "-");
        document.getElementById('drawerThirdVal').innerText = String(getTicketThird(ticket) || '-');
        document.getElementById('drawerDescVal').innerText = String(ticket.description || "Nenhum relato ou informação adicional informada.");
        var customerMessageBox = document.getElementById('drawerCustomerMessageBox');
        var customerMessageText = document.getElementById('drawerCustomerMessageText');
        if (customerMessageBox && customerMessageText) {
          var isTagChargePilot = normalizeProduct(ticket.product) === 'PEDÁGIO' && ticket.solicitacao === 'Cobrança fora da TAG';
          customerMessageText.innerText = buildCustomerOpeningMessage(ticket);
          customerMessageBox.style.display = ticket.status === 'Em andamento' && isTagChargePilot ? 'block' : 'none';
        }

        var phoneDisplay = document.getElementById('drawerPhoneDisplay');
        var rawPhone = ticket.contact !== undefined && ticket.contact !== null ? String(ticket.contact).trim() : "";
        phoneDisplay.innerText = (rawPhone && rawPhone !== "null" && rawPhone !== "undefined") ? rawPhone : "Sem telefone informado";

        var dafCell = document.getElementById('drawerDafCell');
        var dafVal = document.getElementById('drawerDafVal');
        if (ticket.dafRede) {
          dafCell.style.display = 'block';
          var muniText = ticket.dafMunicipio ? ' (' + ticket.dafMunicipio + ')' : '';
          dafVal.innerText = String(ticket.dafRede) + muniText;
        } else {
          dafCell.style.display = 'none';
        }

        var bitrixCell = document.getElementById('drawerBitrixCell');
        var bitrixLink = document.getElementById('drawerBitrixLink');
        var bitrixLabel = document.getElementById('drawerBitrixLabel');
        if (ticket.bitrixLink) {
          bitrixCell.style.display = 'block';
          bitrixLink.href = String(ticket.bitrixLink);
          bitrixLabel.innerText = ticket.solicitacao === 'Chamado T.I' ? 'Card Bitrix (T.I)' : 'E-mail / Chamado Externo';
        } else {
          bitrixCell.style.display = 'none';
        }

        var isOpen = (ticket.status === 'Em andamento');
        document.getElementById('btnCompleteTicket').style.display = isOpen ? 'block' : 'none';
        var btnEdit = document.getElementById('btnToggleEdit');
        if (btnEdit) {
          btnEdit.style.display = 'inline-flex';
          btnEdit.style.alignItems = 'center';
          btnEdit.style.justifyContent = 'center';
          btnEdit.style.flex = isOpen ? '0 0 auto' : '1';
          btnEdit.innerHTML = '✎ Editar Demanda';
          btnEdit.classList.toggle('btn-edit-highlight', !isOpen);
        }
        
        var displayStart = formatDateDisplay(ticket.startDate);
        var openedAtNode = document.getElementById('drawerOpenedAt');
        if (openedAtNode) openedAtNode.innerText = displayStart || 'Não informada';
        document.getElementById('step1Time').innerText = displayStart;
        document.getElementById('step2Time').innerText = displayStart;
        document.getElementById('step2Title').innerText = 'Acionado ' + String(getTicketThird(ticket) || 'Terceiro');
        document.getElementById('step2Desc').innerText = normalizeProduct(ticket.product) === 'PEDÁGIO' ? 'Aguardando parecer técnico / laudo de rodovia.' : 'Aguardando validação técnica e retorno do terceiro.';

        var step3 = document.getElementById('step3Container');
        var step3Time = document.getElementById('step3Time');
        var slaHighlight = document.getElementById('slaFinalHighlight');
        var clocksBox = document.getElementById('drawerProgressClocks');

        var cleanRet = formatOnlyDateBR(ticket.returnDate);
        var historicalSlaBox = document.getElementById('drawerHistoricalSla');
        if (historicalSlaBox) {
          var historyStats = calcCurrentSlaStats();
          var historyRow = ticket.solicitacao === 'Isenção' ? historyStats['Isenção'] : (historyStats[normalizeProduct(ticket.product) + '|' + String(ticket.solicitacao || 'Outros')] || historyStats[String(ticket.solicitacao || 'Outros')]);
          var historyMean = historyRow && Number(historyRow.mean) > 0 ? String(historyRow.mean).replace('.', ',') + ' dias' : 'Ainda sem histórico';
          var partnerDays = getFixedPartnerSla(ticket.product, ticket.solicitacao);
          historicalSlaBox.style.display = (partnerDays || (historyRow && Number(historyRow.mean) > 0)) ? 'block' : 'none';
          var historicalSlaValue = document.getElementById('drawerHistoricalSlaValue');
          if (historicalSlaValue) historicalSlaValue.innerText = (partnerDays ? 'SLA oficial do parceiro: ' + partnerDays + (ticket.solicitacao === 'Cobrança fora da TAG' ? ' dias úteis. ' : ' dias corridos. ') : '') +
            'SLA médio para esta solicitação: ' + historyMean + ' (referência histórica, não é prazo oficial).';
        }

        if (ticket.status === 'Concluído') {
          step3.style.display = 'block';
          step3Time.innerText = formatDateDisplay(ticket.endDate || cleanRet || ticket.startDate);
          slaHighlight.style.display = 'block';
          var sVal = (ticket.durationDays !== null && ticket.durationDays !== undefined) ? ticket.durationDays : '-';
          slaHighlight.innerText = 'SLA Final do atendimento: ' + sVal + ' dias corridos.';
          clocksBox.style.display = 'none';
        } else {
          step3.style.display = 'none';
          slaHighlight.style.display = 'none';
          clocksBox.style.display = 'block';

          var partnerSlaDays = getFixedPartnerSla(ticket.product, ticket.solicitacao);
          var officialDeadline = getOfficialDeadline(ticket);
          var elapsed = getElapsedTime(ticket.startDate);
          if (partnerSlaDays) {
            var officialStatus = getRemainingTime(officialDeadline);
            document.getElementById('drawerClockRem').innerText = officialDeadline + ' · ' + officialStatus.text + ' (' + partnerSlaDays + (ticket.solicitacao === 'Cobrança fora da TAG' ? ' dias úteis)' : ' dias corridos)');
          } else {
            document.getElementById('drawerClockRem').innerText = 'Não definido';
          }
          document.getElementById('drawerClockElapsed').innerText = elapsed;
        }

        document.getElementById('drawerOverlay').style.display = 'flex';
      } catch (err) {
        console.error("Erro no drawer:", err);
      }
    }

    function populateSolicitacaoOptions(selectEl, product, selectedValue) {
      var prod = normalizeProduct(product);
      var options = [];
      if (prod === 'PEDÁGIO') {
        options = [
          { v: 'Contestação', l: 'Contestação' },
          { v: 'Integração API', l: 'Integração API' },
          { v: 'Exceção VPO', l: 'Exceção VPO' },
          { v: 'Chamado T.I', l: 'Chamado T.I' },
          { v: 'Isenção', l: 'Isenção' },
          { v: 'Logistica', l: 'Logística' },
          { v: 'Cancelamento', l: 'Cancelamento' },
          { v: 'Cobrança fora da TAG', l: 'Cobrança fora da TAG' }
        ];
      } else if (prod === 'MANUTENÇÃO') {
        options = [
          { v: 'Layout XML', l: 'Layout XML' },
          { v: 'Outros', l: 'Outros' }
        ];
      } else {
        options = [
          { v: 'Logistica', l: 'Logística' },
          { v: 'Chamado T.I', l: 'Chamado T.I' },
          { v: 'Isenção', l: 'Isenção' }
        ];
      }
      if (selectedValue && !options.some(function(o) { return o.v === selectedValue; })) {
        options.push({ v: selectedValue, l: selectedValue });
      }
      selectEl.innerHTML = options.map(function(o) {
        return '<option value="' + o.v + '">' + o.l + '</option>';
      }).join('');
      if (selectedValue) {
        selectEl.value = selectedValue;
      }
    }

    function onEditDrawerProductChange() {
      var prod = document.getElementById('editDrawerProduct').value;
      var solSel = document.getElementById('editDrawerSolicitacao');
      populateSolicitacaoOptions(solSel, prod, null);
      document.getElementById('editDrawerDafGroup').style.display = (prod === 'MANUTENÇÃO' ? 'grid' : 'none');
      
      var terceiroSel = document.getElementById('editDrawerTerceiro');
      if (prod === 'PEDÁGIO') terceiroSel.value = 'MoveMais';
      else if (prod === 'MANUTENÇÃO') terceiroSel.value = 'Outros';
      else terceiroSel.value = 'Cadastro';
      
      onEditDrawerSolicitacaoChange();
    }

    function onEditDrawerSolicitacaoChange() {
      var sol = document.getElementById('editDrawerSolicitacao').value;
      var prod = normalizeProduct(document.getElementById('editDrawerProduct').value);
      var linkGroup = document.getElementById('editDrawerLinkGroup');
      var linkLabel = document.getElementById('editDrawerLinkLabel');
      var terceiroSel = document.getElementById('editDrawerTerceiro');
      var descLabel = document.getElementById('editDrawerDescLabel');
      var editReturnInput = document.getElementById('editDrawerReturnDate');
      var fixedDays = getFixedPartnerSla(prod, sol);
      var isManualExemption = sol === 'Isenção' && (prod === 'PEDÁGIO' || prod === 'ABASTECIMENTO');
      if (editReturnInput) {
        var returnLabel = document.getElementById('editDrawerReturnLabel');
        if (returnLabel) returnLabel.innerText = isManualExemption ? 'Retorno agendado ao Financeiro * (um dia antes do fechamento)' : 'Data Prevista Retorno (DD/MM/AAAA)';
        editReturnInput.title = isManualExemption ? 'Agende para um dia antes do fechamento do cliente.' : '';
        editReturnInput.readOnly = !!fixedDays;
        editReturnInput.placeholder = fixedDays ? 'Prazo fixo do parceiro' : (isManualExemption ? 'Obrigatório: retorno ao Financeiro' : 'Opcional: DD/MM/AAAA');
      }

      var needsLink = ['Contestação', 'Isenção', 'Cancelamento', 'Cobrança fora da TAG', 'Chamado T.I', 'Layout XML'].indexOf(sol) !== -1 || (prod === 'PEDÁGIO' && ['Integração API', 'Exceção VPO'].indexOf(sol) !== -1);
      
      if (needsLink) {
        linkGroup.style.display = 'block';
        if (sol === 'Chamado T.I' || sol === 'Layout XML') linkLabel.innerText = 'Link Card Bitrix * (Obrigatório)';
        else if (prod === 'PEDÁGIO' && ['Integração API', 'Exceção VPO'].indexOf(sol) !== -1) linkLabel.innerText = 'Link do e-mail de solicitação * (Obrigatório)';
        else linkLabel.innerText = 'Link do E-mail / Chamado Externo * (Obrigatório)';
      } else {
        linkGroup.style.display = 'none';
      }

      if (prod === 'MANUTENÇÃO' && sol === 'Outros') {
        descLabel.innerText = 'Descrição detalhada do Assunto * (Obrigatório)';
        descLabel.style.color = '#F59E0B';
      } else {
        descLabel.innerText = 'Informações Complementares / Pareceres';
        descLabel.style.color = '#E2E8F0';
      }

      if (sol === 'Chamado T.I' || sol === 'Layout XML') terceiroSel.value = 'T.I';
      else if (['Contestação', 'Cancelamento', 'Cobrança fora da TAG', 'Integração API'].indexOf(sol) !== -1) terceiroSel.value = 'MoveMais';
      else if (sol === 'Isenção') terceiroSel.value = 'Financeiro';
      else if (sol === 'Logistica') terceiroSel.value = 'Cadastro';
      else if (prod === 'MANUTENÇÃO' && sol === 'Outros') terceiroSel.value = 'Outros';
      else if (prod === 'PEDÁGIO' && sol === 'Exceção VPO') terceiroSel.value = 'MoveMais';
    }

    function onEditDrawerDafChange(selectedMuni) {
      var casa = document.getElementById('editDrawerDafRede').value;
      var muniSel = document.getElementById('editDrawerDafMuni');
      muniSel.innerHTML = '<option value="">Selecione...</option>';
      if (casa && DAF_CASA_MUNICIPALES[casa]) {
        DAF_CASA_MUNICIPALES[casa].forEach(function(m) {
          muniSel.innerHTML += '<option value="' + m + '">' + m + '</option>';
        });
      }
      if (selectedMuni) muniSel.value = selectedMuni;
    }

    function appendTimestampedNote() {
      var ta = document.getElementById('editDrawerDescription');
      var agent = getActiveOperator();
      var now = new Date();
      var stamp = '[' + String(now.getDate()).padStart(2, '0') + '/' + String(now.getMonth() + 1).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ' - ' + agent + ']: ';
      var current = ta.value.trim();
      ta.value = current ? (stamp + '\n' + current) : stamp;
      ta.focus();
      ta.setSelectionRange(stamp.length, stamp.length);
    }

    function toggleEditDrawerForm() {
      if (!activeSelectedTicket) return;
      var editForm = document.getElementById('drawerEditForm');
      var detailGrid = document.getElementById('drawerDetailGrid');

      var btnEdit = document.getElementById('btnToggleEdit');
      if (editForm.style.display === 'flex') {
        editForm.style.display = 'none';
        detailGrid.style.display = 'grid';
        if (btnEdit) btnEdit.innerHTML = '✎ Editar Demanda';
      } else {
        if (btnEdit) btnEdit.innerHTML = '✕ Cancelar Edição';
        refreshOperatorDropdowns();
        var prod = normalizeProduct(activeSelectedTicket.product);
        document.getElementById('editDrawerClient').value = activeSelectedTicket.client || "";
        document.getElementById('editDrawerProduct').value = prod;
        populateSolicitacaoOptions(document.getElementById('editDrawerSolicitacao'), prod, (prod === 'MANUTENÇÃO' && activeSelectedTicket.solicitacao === 'Chamado T.I') ? 'Layout XML' : activeSelectedTicket.solicitacao);
        document.getElementById('editDrawerContact').value = activeSelectedTicket.contact || "";
        document.getElementById('editDrawerOperator').value = activeSelectedTicket.operator || getActiveOperator();
        document.getElementById('editDrawerTerceiro').value = activeSelectedTicket.terceiro || "MoveMais";
        var editReturnInput = document.getElementById('editDrawerReturnDate');
        var activeFixedDays = getFixedPartnerSla(prod, activeSelectedTicket.solicitacao);
        editReturnInput.value = activeFixedDays ? getOfficialDeadline(activeSelectedTicket) : formatOnlyDateBR(activeSelectedTicket.returnDate);
        editReturnInput.readOnly = !!activeFixedDays;
        document.getElementById('editDrawerDescription').value = activeSelectedTicket.description || "";
        document.getElementById('editDrawerLink').value = activeSelectedTicket.bitrixLink || "";

        var dafSel = document.getElementById('editDrawerDafRede');
        dafSel.innerHTML = '<option value="">Selecione...</option>';
        Object.keys(DAF_CASA_MUNICIPALES).forEach(function(c) {
          dafSel.innerHTML += '<option value="' + c + '">' + c + '</option>';
        });
        if (prod === 'MANUTENÇÃO') {
          document.getElementById('editDrawerDafGroup').style.display = 'grid';
          dafSel.value = activeSelectedTicket.dafRede || "";
          onEditDrawerDafChange(activeSelectedTicket.dafMunicipio || "");
        } else {
          document.getElementById('editDrawerDafGroup').style.display = 'none';
        }

        onEditDrawerSolicitacaoChange();
        if (prod === 'PEDÁGIO' && activeSelectedTicket.solicitacao === 'Exceção VPO') {
          document.getElementById('editDrawerTerceiro').value = 'MoveMais';
        }
        editForm.style.display = 'flex';
        detailGrid.style.display = 'none';
      }
    }

    function handleSaveDrawerEdit(e) {
      e.preventDefault();
      if (!activeSelectedTicket) return;

      var newClient = document.getElementById('editDrawerClient').value.trim();
      var newProd = normalizeProduct(document.getElementById('editDrawerProduct').value);
      var newSol = document.getElementById('editDrawerSolicitacao').value;
      var newContact = document.getElementById('editDrawerContact').value.trim();
      var newOp = document.getElementById('editDrawerOperator').value;
      var newTerceiro = document.getElementById('editDrawerTerceiro').value;
      var newReturn = formatOnlyDateBR(document.getElementById('editDrawerReturnDate').value.trim());
      var isFinalizedTicket = activeSelectedTicket.status === 'Concluído';
      var fixedEditSla = getFixedPartnerSla(newProd, newSol);
      var manualEditExemption = newSol === 'Isenção' && (newProd === 'PEDÁGIO' || newProd === 'ABASTECIMENTO');
      if (fixedEditSla && !isFinalizedTicket) {
        var openedAtForDeadline = parseDateBR(activeSelectedTicket.startDate) || new Date();
        newReturn = formatOnlyDateBR(formatDateInput(addCalendarDays(openedAtForDeadline, fixedEditSla)));
      }
      if (manualEditExemption && !newReturn && !isFinalizedTicket) {
        showToast('Agende a data obrigatória de retorno ao Financeiro para Isenção.', true);
        return;
      }
      var newDesc = document.getElementById('editDrawerDescription').value.trim();
      var newLink = document.getElementById('editDrawerLink').value.trim();
      var newDafRede = newProd === 'MANUTENÇÃO' ? document.getElementById('editDrawerDafRede').value : "";
      var newDafMuni = newProd === 'MANUTENÇÃO' ? document.getElementById('editDrawerDafMuni').value : "";

      var needsLink = ['Contestação', 'Isenção', 'Cancelamento', 'Cobrança fora da TAG', 'Chamado T.I', 'Layout XML'].indexOf(newSol) !== -1 ||
        (newProd === 'PEDÁGIO' && ['Integração API', 'Exceção VPO'].indexOf(newSol) !== -1);
      if (needsLink && !newLink && activeSelectedTicket.status !== 'Concluído') {
        showToast("O Link Externo (E-mail ou Bitrix) é obrigatório.", true);
        return;
      }
      if (newProd === 'PEDÁGIO' && newSol === 'Exceção VPO') newTerceiro = 'MoveMais';
      if (newProd === 'MANUTENÇÃO' && newSol === 'Outros' && !newDesc) {
        showToast("A descrição do assunto 'Outros' é obrigatória.", true);
        return;
      }

      var returnChanged = newReturn !== formatOnlyDateBR(activeSelectedTicket.returnDate);

      var updatedTicket = Object.assign({}, activeSelectedTicket, {
        client: newClient || activeSelectedTicket.client,
        product: newProd,
        solicitacao: newSol,
        contact: newContact,
        operator: newOp,
        terceiro: getResponsibleSector(newProd, newSol) || newTerceiro,
        returnDate: newReturn,
        description: newDesc,
        bitrixLink: newLink,
        dafRede: newDafRede,
        dafMunicipio: newDafMuni,
        isAutoReturn: returnChanged ? false : activeSelectedTicket.isAutoReturn,
        updatedAt: new Date().toISOString()
      });

      allTickets = allTickets.map(function(t) { return t.id === updatedTicket.id ? updatedTicket : t; });
      saveStoredTickets();
      sendMutationToSheet("update", updatedTicket, false);
      
      toggleEditDrawerForm();
      openDrawer(updatedTicket);
      renderAll();
      showToast("Alterações salvas e sincronizadas!");
    }

    function closeDrawer(e) {
      if (e.target.id === 'drawerOverlay') closeDrawerDirect();
    }

    function closeDrawerDirect() {
      document.getElementById('drawerOverlay').style.display = 'none';
      activeSelectedTicket = null;
    }

    function copyDrawerPhone() {
      if (!activeSelectedTicket || !activeSelectedTicket.contact) {
        showToast("Sem telefone informado neste card.", true);
        return;
      }
      navigator.clipboard.writeText(String(activeSelectedTicket.contact)).then(function() {
        showToast("Número copiado: " + activeSelectedTicket.contact);
      });
    }

    function completeSelectedTicket() {
      if (!activeSelectedTicket) return;
      var now = new Date();
      var d = String(now.getDate()).padStart(2, '0');
      var m = String(now.getMonth() + 1).padStart(2, '0');
      var y = now.getFullYear();
      var h = String(now.getHours()).padStart(2, '0');
      var min = String(now.getMinutes()).padStart(2, '0');
      var nowStr = d + '/' + m + '/' + y + ' ' + h + ':' + min;

      var start = parseDateBR(activeSelectedTicket.startDate);
      var diffDays = start ? Math.max(0.1, (now - start) / (1000 * 60 * 60 * 24)).toFixed(1) : "1.0";

      var updatedTicket = Object.assign({}, activeSelectedTicket, {
        status: "Concluído",
        endDate: nowStr,
        durationDays: parseFloat(diffDays),
        returnDate: d + '/' + m + '/' + y,
        updatedAt: now.toISOString()
      });

      allTickets = allTickets.map(function(t) { return t.id === updatedTicket.id ? updatedTicket : t; });
      saveStoredTickets();
      sendMutationToSheet("update", updatedTicket, false);
      openDrawer(updatedTicket);
      renderAll();
      showToast("Demanda finalizada (SLA: " + diffDays + " dias)!");
    }

    function executeDelete(ticket) {
      if (!ticket) return;
      var targetId = String(ticket.id || "").trim();
      if (!targetId) return;

      var delList = getDeletedIds();
      if (delList.indexOf(targetId) === -1) {
        delList.push(targetId);
        saveDeletedIds(delList);
      }

      allTickets = allTickets.filter(function(t) { return String(t.id).trim() !== targetId; });
      saveStoredTickets();
      sendMutationToSheet("delete", ticket, false);
      closeDrawerDirect();
      renderAll();
      showToast("Demanda excluída definitivamente.");
    }

    function deleteSelectedTicket() {
      if (!activeSelectedTicket) return;
      var clientName = activeSelectedTicket.client || "esta demanda";
      if (!confirm("Tem certeza que deseja excluir " + clientName + " definitivamente para toda a equipe?")) {
        return;
      }
      executeDelete(activeSelectedTicket);
    }

    function editTicketById(e, id) {
      if (e) e.stopPropagation();
      var ticket = allTickets.find(function(t) { return String(t.id).trim() === String(id).trim(); });
      if (!ticket) return;
      openDrawer(ticket);
      var editForm = document.getElementById('drawerEditForm');
      if (editForm && editForm.style.display !== 'flex') {
        toggleEditDrawerForm();
      }
    }

    function deleteTicketById(e, id) {
      if (e) e.stopPropagation();
      var ticket = allTickets.find(function(t) { return String(t.id).trim() === String(id).trim(); });
      var clientName = ticket ? ticket.client : "esta demanda";
      if (!confirm("Deseja excluir " + clientName + " definitivamente?")) {
        return;
      }
      if (ticket) executeDelete(ticket);
    }

    // =========================================================================
    // MODAL NOVA DEMANDA
    // =========================================================================
    function openNewModal() {
      document.getElementById('newDemandForm').reset();
      document.getElementById('modalFeedbackText').innerText = '';
      modalAutoReturnFlag = false;
      
      refreshOperatorDropdowns();
      document.getElementById('modalOperatorSelect').value = getActiveOperator();

      var dafSel = document.getElementById('modalDafSelect');
      dafSel.innerHTML = '<option value="">Selecione a Casa DAF...</option>';
      Object.keys(DAF_CASA_MUNICIPALES).forEach(function(casa) {
        dafSel.innerHTML += '<option value="' + casa + '">' + casa + '</option>';
      });

      onModalProductChange();
      document.getElementById('modalOverlay').style.display = 'flex';
    }

    function closeModalDirect(e) {
      if (!e || e.target.id === 'modalOverlay') {
        document.getElementById('modalOverlay').style.display = 'none';
      }
    }

    function onModalProductChange() {
      var prod = document.getElementById('modalProductSelect').value;
      var servSel = document.getElementById('modalServiceSelect');
      var dafGroup = document.getElementById('modalDafGroup');
      var terceiroSel = document.getElementById('modalTerceiroSelect');

      populateSolicitacaoOptions(servSel, prod, null);

      if (prod === 'PEDÁGIO') {
        dafGroup.style.display = 'none';
        terceiroSel.value = 'MoveMais';
      } else if (prod === 'MANUTENÇÃO') {
        dafGroup.style.display = 'block';
        terceiroSel.value = 'Outros';
      } else {
        dafGroup.style.display = 'none';
        terceiroSel.value = 'Cadastro';
      }
      onModalServiceChange();
    }

    function onModalDafCasaChange() {
      var casa = document.getElementById('modalDafSelect').value;
      var muniSel = document.getElementById('modalDafMunicipioSelect');
      muniSel.innerHTML = '<option value="">Selecione o Município...</option>';
      if (casa && DAF_CASA_MUNICIPALES[casa]) {
        DAF_CASA_MUNICIPALES[casa].forEach(function(muni) {
          muniSel.innerHTML += '<option value="' + muni + '">' + muni + '</option>';
        });
      }
    }

    function addCalendarDays(baseDate, days) {
      var result = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
      result.setDate(result.getDate() + days);
      return result;
    }

    function formatDateInput(date) {
      return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    }

    function getFixedPartnerSla(product, service) {
      if (normalizeProduct(product) !== 'PEDÁGIO') return 0;
      if (service === 'Cobrança fora da TAG') return 10;
      if (service === 'Contestação') return 30;
      return 0;
    }

    function getEasterSunday(year) {
      var a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
      return new Date(year,month-1,day);
    }
    function isBrazilNationalHoliday(date) {
      var y=date.getFullYear(), m=date.getMonth()+1, d=date.getDate();
      var fixed=['1-1','4-21','5-1','9-7','10-12','11-2','11-15','11-20','12-25'];
      if (fixed.indexOf(m+'-'+d)!==-1) return true;
      var easter=getEasterSunday(y), goodFriday=new Date(easter); goodFriday.setDate(easter.getDate()-2);
      return date.getFullYear()===goodFriday.getFullYear() && date.getMonth()===goodFriday.getMonth() && date.getDate()===goodFriday.getDate();
    }
    function addBusinessDays(baseDate, days) {
      var result = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
      var added = 0;
      while (added < days) { result.setDate(result.getDate() + 1); var weekday = result.getDay(); if (weekday !== 0 && weekday !== 6 && !isBrazilNationalHoliday(result)) added++; }
      return result;
    }
    function countBusinessDays(fromDate, toDate) {
      if (!fromDate || !toDate || toDate <= fromDate) return 0;
      var cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
      var end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate()); var count = 0;
      while (cursor < end) { cursor.setDate(cursor.getDate() + 1); var day = cursor.getDay(); if (day !== 0 && day !== 6 && !isBrazilNationalHoliday(cursor)) count++; }
      return count;
    }
    function getOfficialDeadline(ticket) {
      var days = getFixedPartnerSla(ticket.product, ticket.solicitacao);
      var start = parseDateBR(ticket.startDate);
      if (!days || !start) return '';
      var due = ticket.solicitacao === 'Cobrança fora da TAG' ? addBusinessDays(start, days) : addCalendarDays(start, days);
      return formatOnlyDateBR(formatDateInput(due));
    }

    function getResponsibleSector(product, service) {
      var p = normalizeProduct(product);
      if (service === 'Isenção') return 'Financeiro';
      if (service === 'Chamado T.I' || service === 'Layout XML') return 'T.I';
      if (p === 'PEDÁGIO' && ['Cancelamento', 'Cobrança fora da TAG', 'Contestação', 'Integração API', 'Exceção VPO'].indexOf(service) !== -1) return 'MoveMais';
      if (p === 'ABASTECIMENTO' && service === 'Logistica') return 'Cadastro';
      if (p === 'MANUTENÇÃO' && service === 'Outros') return 'Outros';
      return '';
    }

    function getDisplaySolicitation(ticket) {
      if (normalizeProduct(ticket.product) === 'MANUTENÇÃO' && ticket.solicitacao === 'Chamado T.I') return 'Layout XML';
      return String(ticket.solicitacao || 'Solicitação não informada');
    }

    function getTicketThird(ticket) {
      return getResponsibleSector(ticket.product, ticket.solicitacao) || ticket.terceiro || 'Outros';
    }

    function onModalServiceChange() {
      var serv = document.getElementById('modalServiceSelect').value;
      var prod = normalizeProduct(document.getElementById('modalProductSelect').value);
      var linkGroup = document.getElementById('modalLinkGroup');
      var linkLabel = document.getElementById('modalLinkLabel');
      var descLabel = document.getElementById('modalDescLabel');
      var terceiroSel = document.getElementById('modalTerceiroSelect');
      var returnInput = document.getElementById('modalReturnDateInput');
      var returnLabel = document.getElementById('modalReturnDateLabel');
      var calcButton = document.getElementById('btnCalculateReturnDate');
      var feedback = document.getElementById('modalFeedbackText');
      var fixedDays = getFixedPartnerSla(prod, serv);
      var isManualExemption = serv === 'Isenção' && (prod === 'PEDÁGIO' || prod === 'ABASTECIMENTO');

      var needsLink = ['Contestação', 'Isenção', 'Cancelamento', 'Cobrança fora da TAG', 'Chamado T.I', 'Layout XML'].indexOf(serv) !== -1 ||
        (prod === 'PEDÁGIO' && ['Integração API', 'Exceção VPO'].indexOf(serv) !== -1);

      linkGroup.style.display = needsLink ? 'block' : 'none';
      linkLabel.innerText = (serv === 'Chamado T.I' || serv === 'Layout XML') ? 'Link Card Bitrix * (Obrigatório)' :
        (prod === 'PEDÁGIO' && ['Integração API', 'Exceção VPO'].indexOf(serv) !== -1 ? 'Link do e-mail de solicitação * (Obrigatório)' : 'Link do E-mail / Chamado Externo * (Obrigatório)');

      if (prod === 'MANUTENÇÃO' && serv === 'Outros') {
        descLabel.innerText = 'Descrição detalhada do Assunto * (Obrigatório)';
        descLabel.style.color = '#F59E0B';
      } else {
        descLabel.innerText = 'Informações Complementares / Ocorrência no IP';
        descLabel.style.color = '#E2E8F0';
      }

      if (serv === 'Chamado T.I' || serv === 'Layout XML') terceiroSel.value = 'T.I';
      else if (['Contestação', 'Cancelamento', 'Cobrança fora da TAG', 'Integração API'].indexOf(serv) !== -1) terceiroSel.value = 'MoveMais';
      else if (serv === 'Isenção') terceiroSel.value = 'Financeiro';
      else if (serv === 'Logistica') terceiroSel.value = 'Cadastro';
      else if (prod === 'MANUTENÇÃO' && serv === 'Outros') terceiroSel.value = 'Outros';
      else if (prod === 'PEDÁGIO' && serv === 'Exceção VPO') terceiroSel.value = 'MoveMais';

      returnInput.required = !!fixedDays || isManualExemption;
      returnInput.readOnly = !!fixedDays;
      returnInput.disabled = false;
      calcButton.style.display = fixedDays ? 'none' : 'none';
      returnLabel.innerText = fixedDays ? 'Data de retorno (prazo fixo do parceiro) *' :
        (isManualExemption ? 'Retorno agendado ao Financeiro *' : 'Data para Retorno ao Cliente (opcional)');

      if (fixedDays) {
        returnInput.value = formatDateInput(serv === 'Cobrança fora da TAG' ? addBusinessDays(new Date(), fixedDays) : addCalendarDays(new Date(), fixedDays));
        modalAutoReturnFlag = true;
        feedback.innerText = 'Prazo definido pelo parceiro: ' + fixedDays + (serv === 'Cobrança fora da TAG' ? ' dias úteis. Data calculada automaticamente e não editável.' : ' dias corridos. Data calculada automaticamente e não editável.');
      } else {
        returnInput.value = '';
        modalAutoReturnFlag = false;
        feedback.innerText = isManualExemption ? 'Retorno destinado ao Financeiro: agende para um dia antes do fechamento do cliente.' : '';
      }
    }

    function markManualReturnDate() {
      modalAutoReturnFlag = false;
      var feedback = document.getElementById('modalFeedbackText');
      if (feedback) feedback.innerText = 'Data de retorno informada manualmente pelo operador.';
    }

    function calculateModalReturnDate() {
      // O cálculo automático é restrito aos prazos oficiais da Move Mais.
      onModalServiceChange();
    }

    function handleSaveDemandForm(e) {
      e.preventDefault();
      var f = e.target;
      var prod = normalizeProduct(document.getElementById('modalProductSelect').value);
      var serv = document.getElementById('modalServiceSelect').value;
      var linkVal = document.getElementById('modalLinkInput').value.trim();

      if (prod === 'MANUTENÇÃO') {
        if (!f.dafRede.value || !f.dafMunicipio.value) {
          showToast("Selecione a Casa DAF e o Município.", true);
          return;
        }
      }

      var needsLink = ['Contestação', 'Isenção', 'Cancelamento', 'Cobrança fora da TAG', 'Chamado T.I', 'Layout XML'].indexOf(serv) !== -1 ||
        (prod === 'PEDÁGIO' && ['Integração API', 'Exceção VPO'].indexOf(serv) !== -1);
      if (needsLink && !linkVal) {
        showToast("O Link Externo (E-mail ou Bitrix) é obrigatório.", true);
        return;
      }
      if (prod === 'MANUTENÇÃO' && serv === 'Outros' && !f.desc.value.trim()) {
        showToast("A descrição do assunto 'Outros' é obrigatória.", true);
        return;
      }

      var now = new Date();
      var d = String(now.getDate()).padStart(2, '0');
      var m = String(now.getMonth() + 1).padStart(2, '0');
      var y = now.getFullYear();
      var h = String(now.getHours()).padStart(2, '0');
      var min = String(now.getMinutes()).padStart(2, '0');

      var rawReturn = f.returnDate.value;
      var fixedSlaDays = getFixedPartnerSla(prod, serv);
      var isManualExemption = serv === 'Isenção' && (prod === 'PEDÁGIO' || prod === 'ABASTECIMENTO');
      if ((fixedSlaDays || isManualExemption) && !rawReturn) {
        showToast('Informe a data obrigatória de retorno desta solicitação.', true);
        return;
      }
      if (fixedSlaDays) rawReturn = formatDateInput(addCalendarDays(now, fixedSlaDays));
      var formattedReturn = formatOnlyDateBR(rawReturn) || 'A definir';
      var uniqueId = "REC-" + String(Date.now()).slice(-6) + "-" + Math.floor(100 + Math.random() * 900);

      var newRec = {
        id: uniqueId,
        mes: m + "-" + y,
        operator: f.operator.value,
        product: prod,
        client: f.client.value.trim(),
        contact: f.contact.value.trim(),
        solicitacao: serv,
        terceiro: getResponsibleSector(prod, serv) || f.terceiro.value,
        bitrixLink: linkVal,
        dafRede: prod === 'MANUTENÇÃO' ? f.dafRede.value : "",
        dafMunicipio: prod === 'MANUTENÇÃO' ? f.dafMunicipio.value : "",
        status: "Em andamento",
        startDate: d + '/' + m + '/' + y + ' ' + h + ':' + min,
        endDate: "",
        durationDays: null,
        returnDate: formattedReturn,
        isAutoReturn: modalAutoReturnFlag,
        description: f.desc.value.trim(),
        updatedAt: now.toISOString()
      };

      allTickets.unshift(newRec);
      saveStoredTickets();
      sendMutationToSheet("create", newRec, false);

      document.getElementById('modalOverlay').style.display = 'none';
      renderAll();
      openDrawer(newRec);
      showToast("Nova demanda planilhada com sucesso!");
    }

    // =========================================================================
    // RELATÓRIO DE SLA ("B.I ANTIGO" COM CATEGORIAS E DEGRADÊ SEMAFÓRICO)
    // =========================================================================
    function getBiCategory(t) {
      var p = normalizeProduct(t.product);
      var s = String(t.solicitacao || '').trim();
      if (s === 'Isenção') return 'Isenção';
      if (p === 'PEDÁGIO') {
        if (s === 'Cancelamento') return 'Pedágio MoveMais - Cancelamento';
        if (s === 'Contestação') return 'Pedágio MoveMais - Contestação';
        if (s === 'Chamado T.I') return 'Pedágio - Chamado T.I';
        if (s === 'Cobrança fora da TAG') return 'Pedágio MoveMais - Cobrança fora da TAG';
        if (s === 'Integração API') return 'Pedágio MoveMais - Integração API';
        if (s === 'Exceção VPO') return 'Pedágio - Exceção VPO';
        return 'Pedágio - ' + s;
      }
      if (p === 'MANUTENÇÃO') {
        if (s === 'Chamado T.I' || s === 'Layout XML') return 'Manutenção - Layout XML';
        if (s === 'Outros') return 'Manutenção - Outros';
        return 'Manutenção - ' + s;
      }
      if (p === 'ABASTECIMENTO') {
        if (s === 'Logistica') return 'Abastecimento - Logística';
        if (s === 'Chamado T.I') return 'Abastecimento - Chamado T.I';
        return 'Abastecimento - ' + s;
      }
      return p + ' - ' + s;
    }

    function getMatrixDefinitions() {
      return [
        { name: 'Pedágio - Isenção', third: 'Financeiro', products: ['PEDÁGIO', 'ABASTECIMENTO'], service: 'Isenção' },
        { name: 'Pedágio MoveMais - Cancelamento', third: 'MoveMais', products: ['PEDÁGIO'], service: 'Cancelamento' },
        { name: 'Pedágio MoveMais - Cobrança fora da TAG', third: 'MoveMais', products: ['PEDÁGIO'], service: 'Cobrança fora da TAG', partnerDays: 10 },
        { name: 'Pedágio MoveMais - Contestação', third: 'MoveMais', products: ['PEDÁGIO'], service: 'Contestação', partnerDays: 30 },
        { name: 'Pedágio - Chamado T.I', third: 'T.I', products: ['PEDÁGIO'], service: 'Chamado T.I' },
        { name: 'Pedágio MoveMais - Exceção VPO', third: 'MoveMais', products: ['PEDÁGIO'], service: 'Exceção VPO' },
        { name: 'Abastecimento - Logística', third: 'Cadastro', products: ['ABASTECIMENTO'], service: 'Logistica' },
        { name: 'Abastecimento - Chamado T.I', third: 'T.I', products: ['ABASTECIMENTO'], service: 'Chamado T.I' },
        { name: 'Manutenção - Layout XML', third: 'T.I', products: ['MANUTENÇÃO'], service: 'Layout XML' },
        { name: 'Manutenção - Outros', third: 'Outros', products: ['MANUTENÇÃO'], service: 'Outros' }
      ];
    }


    var biFilterProduct = '';
    var biFilterThird = '';
    var biFilterFrom = '';
    var biFilterTo = '';
    function getBiFilteredTickets(status) {
      return allTickets.filter(function(t) {
        if (status && t.status !== status) return false;
        if (biFilterProduct && normalizeProduct(t.product) !== biFilterProduct) return false;
        if (biFilterThird && getTicketThird(t) !== biFilterThird) return false;
        if (status === 'Concluído' && (biFilterFrom || biFilterTo)) {
          var d = parseDateBR(t.endDate || t.returnDate || t.startDate);
          if (biFilterFrom && (!d || d < new Date(biFilterFrom + 'T00:00:00'))) return false;
          if (biFilterTo && (!d || d > new Date(biFilterTo + 'T23:59:59'))) return false;
        }
        return true;
      });
    }
    function applyBiFilters() {
      biFilterProduct = document.getElementById('biFilterProduct').value;
      biFilterThird = document.getElementById('biFilterThird').value;
      biFilterFrom = document.getElementById('biDateFrom').value;
      biFilterTo = document.getElementById('biDateTo').value;
      renderSlaReport();
    }
    function clearBiFilters() {
      ['biFilterProduct','biFilterThird','biDateFrom','biDateTo'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
      applyBiFilters();
    }
    function formatBiDays(value) { return value === null || !isFinite(value) ? '—' : value.toFixed(1).replace('.', ',') + ' dias'; }
    function biAverage(items) {
      var vals=items.filter(function(t){return t.durationDays!==null && t.durationDays!==undefined && t.durationDays!=='';}).map(function(t){return Number(t.durationDays);}).filter(function(v){return isFinite(v) && v >= 0;});
      return vals.length ? vals.reduce(function(a,b){return a+b;},0)/vals.length : null;
    }
    function biOfficialDays(product, service) {
      var p=normalizeProduct(product), s=String(service||'');
      if (p==='PEDÁGIO' && s==='Contestação') return 30;
      if (p==='PEDÁGIO' && (s==='Cobrança fora da TAG' || s.indexOf('fora da TAG') !== -1)) return 10;
      return null;
    }
    function renderBiBars(container, rows, labelKey, valueKey, colorClass) {
      if (!container) return;
      var max = Math.max(1, ...rows.map(function(r) { return r[valueKey]; }));
      container.innerHTML = rows.length ? rows.map(function(r) {
        var action = '';
        return '<div class="bi-bar-row"><span class="bi-bar-label">' + escapeHtml(r[labelKey]) + '</span><div class="bi-bar-track"><div class="bi-bar-fill ' + colorClass + '" style="width:' + Math.max(2, r[valueKey] / max * 100) + '%"></div></div><strong class="bi-bar-value">' + r[valueKey] + '</strong></div>';
      }).join('') : '<div class="bi-empty">Sem dados para os filtros selecionados.</div>';
    }
    function selectBiPartner(name) { biFilterThird = name; var el = document.getElementById('biFilterThird'); if (el) el.value = name; renderSlaReport(); }
    function selectBiProduct(name) { biFilterProduct = name; var el = document.getElementById('biFilterProduct'); if (el) el.value = name; renderSlaReport(); }
    function renderSlaProjection() {
      var tbody=document.getElementById('projectionBody'), chart=document.getElementById('projectionVolumeChart'), serviceChart=document.getElementById('projectionServiceChart');
      if(!tbody)return;
      var open=allTickets.filter(function(t){ return t.status === 'Em andamento'; }), groups={}, partners={}, services={};
      open.forEach(function(t){var third=getTicketThird(t)||'Outros', product=normalizeProduct(t.product)||'Não informado', service=getDisplaySolicitation(t)||'Outros', key=third+'|'+service+'|'+product; if(!groups[key])groups[key]={third:third,service:service,product:product,count:0};groups[key].count++;partners[third]=(partners[third]||0)+1;services[service]=(services[service]||0)+1;});
      var rows=Object.keys(groups).map(function(k){return groups[k];}).sort(function(a,b){return b.count-a.count||a.third.localeCompare(b.third,'pt-BR');});
      tbody.innerHTML=rows.length?rows.map(function(r){return '<tr><td><span class="bi-partner-tag">'+escapeHtml(r.third)+'</span></td><td>'+escapeHtml(r.service)+'</td><td>'+escapeHtml(r.product)+'</td><td><strong>'+r.count+'</strong></td></tr>';}).join(''):'<tr><td colspan="4">Nenhuma demanda em aberto.</td></tr>';
      renderBiBars(chart,Object.keys(partners).map(function(k){return {label:k,count:partners[k]};}).sort(function(a,b){return b.count-a.count;}),'label','count','bi-fill-cyan');
      renderBiBars(serviceChart,Object.keys(services).map(function(k){return {label:k,count:services[k]};}).sort(function(a,b){return b.count-a.count;}),'label','count','bi-fill-orange');
    }
    function renderSlaReport() {
      var completed=getBiFilteredTickets('Concluído');
      var period=document.getElementById('biPeriodCaption');
      if(period) period.textContent=(biFilterFrom||biFilterTo)?((biFilterFrom||'Início')+' — '+(biFilterTo||'Hoje')):'Todo o histórico';
      var products=['PEDÁGIO','ABASTECIMENTO','MANUTENÇÃO'];
      var productCards=document.getElementById('biProductCards');
      if(productCards){productCards.innerHTML=products.filter(function(p){return !biFilterProduct||p===biFilterProduct;}).map(function(p){var list=completed.filter(function(t){return normalizeProduct(t.product)===p;});var avg=biAverage(list);var color=p==='PEDÁGIO'?'cyan':(p==='ABASTECIMENTO'?'green':'purple');return '<article class="bi-product-card bi-product-'+color+'"><div class="bi-product-card-top"><span>'+escapeHtml(p)+'</span><i></i></div><div class="bi-product-kpis"><div><strong>'+list.length+'</strong><small>Volume concluído</small></div><div><strong>'+formatBiDays(avg)+'</strong><small>SLA médio</small></div></div></article>';}).join('');}
      var partnerNames=['MoveMais','Financeiro','T.I','Cadastro','Outros'];
      var partnerRows=partnerNames.filter(function(n){return !biFilterThird||n===biFilterThird;}).map(function(n){var list=completed.filter(function(t){return getTicketThird(t)===n;});return {name:n,count:list.length,avg:biAverage(list)};}).filter(function(r){return r.count>0;}).sort(function(a,b){return b.count-a.count;});
      var partnerBody=document.getElementById('biPartnerBody');if(partnerBody)partnerBody.innerHTML=partnerRows.length?partnerRows.map(function(r){return '<tr><td><span class="bi-partner-tag">'+escapeHtml(r.name)+'</span></td><td><strong>'+r.count+'</strong></td><td>'+formatBiDays(r.avg)+'</td></tr>';}).join(''):'<tr><td colspan="3">Sem demandas concluídas para os filtros selecionados.</td></tr>';
      // renderBiBars(document.getElementById('biPartnerChart'), ... removed}),'label','count','bi-fill-cyan');
      var groups={};completed.forEach(function(t){
    var service=getDisplaySolicitation(t)||'Outros';
    var product=normalizeProduct(t.product)||'Não informado';
    var third=getTicketThird(t)||'Outros';
    // Unificar Chamado T.I para Pedágio e Abastecimento
    if (service === 'Chamado T.I' && (product === 'PEDÁGIO' || product === 'ABASTECIMENTO')) {
        product = 'PEDÁGIO e ABASTECIMENTO';
    }
    var key=service+'|'+product+'|'+third;
    if(!groups[key]) groups[key]={service:service,product:product,third:third,items:[]};
    groups[key].items.push(t);
});
      var micro=Object.keys(groups).map(function(k){var r=groups[k],official=biOfficialDays(r.product,r.service);return {service:r.service,product:r.product,third:r.third,count:r.items.length,avg:biAverage(r.items),official:official};}).sort(function(a,b){return b.count-a.count||a.service.localeCompare(b.service,'pt-BR');});
      var microBody=document.getElementById('biSolicitationBody');if(microBody)microBody.innerHTML=micro.length?micro.map(function(r){return '<tr><td><strong>'+escapeHtml(r.service)+'</strong></td><td>'+escapeHtml(r.product)+'</td><td><span class="bi-partner-tag">'+escapeHtml(r.third)+'</span></td><td><strong>'+r.count+'</strong></td><td class="td-sla-medio">'+formatBiDays(r.avg)+'</td><td class="td-sla-oficial">'+(r.official?r.official+' dias '+(r.service.indexOf('fora da TAG') !== -1 ? 'úteis' : 'corridos'):'<span class="bi-no-sla">Não definido</span>')+'</td></tr>';}).join(''):'<tr><td colspan="6">Sem solicitações concluídas para os filtros selecionados.</td></tr>';
      var microCount=document.getElementById('biSolicitationCount');if(microCount)microCount.textContent=micro.length+' combinações de solicitação';
    }

