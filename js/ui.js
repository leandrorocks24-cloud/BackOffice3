// INTERFACE, RENDERIZAÇÃO, FORMULÁRIOS E RELATÓRIOS
// =========================================================================
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

    function calcCurrentSlaStats() {
      var completed = allTickets.filter(function(t) { return t.status === 'Concluído' && t.durationDays !== null; });
      var map = {};
      var defaultServices = ['Contestação', 'Chamado T.I', 'Isenção', 'Logistica', 'Cancelamento', 'Cobrança fora da TAG', 'Outros'];
      defaultServices.forEach(function(s) {
        map[s] = { count: 0, sum: 0, vals: [], mean: 0, median: 0 };
      });
      completed.forEach(function(t) {
        var s = String(t.solicitacao || 'Outros');
        if (!map[s]) map[s] = { count: 0, sum: 0, vals: [], mean: 0, median: 0 };
        var dur = parseFloat(t.durationDays);
        if (!isNaN(dur)) {
          map[s].count++;
          map[s].sum += dur;
          map[s].vals.push(dur);
        }
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

    function switchMainTab(tab) {
      document.getElementById('viewPaneRecords').style.display = (tab === 'records' ? 'block' : 'none');
      document.getElementById('viewPaneReport').style.display = (tab === 'report' ? 'block' : 'none');
      document.getElementById('btnTabRecords').className = 'tab-btn ' + (tab === 'records' ? 'active' : '');
      document.getElementById('btnTabReport').className = 'tab-btn ' + (tab === 'report' ? 'active' : '');
      if (tab === 'report') renderSlaReport();
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
        if (third && t.terceiro !== third) return false;
        if (search) {
          var s = (String(t.client || "") + " " + String(t.contact || "") + " " + String(t.solicitacao || "") + " " + String(t.terceiro || "") + " " + String(t.dafRede || "") + " " + String(t.description || "")).toLowerCase();
          if (s.indexOf(search) === -1) return false;
        }
        return true;
      }

      var filteredTickets = allTickets.filter(matchFilters);

      var allOpen = filteredTickets.filter(function(t) { return t.status === 'Em andamento'; });
      var urgentCount = 0;
      allOpen.forEach(function(t) {
        if (getRemainingTime(t.returnDate).isUrgent) urgentCount++;
      });
      var onTimeCount = Math.max(0, allOpen.length - urgentCount);

      var allDone = filteredTickets.filter(function(t) { return t.status === 'Concluído' && t.durationDays !== null; });
      var avgSla = "-";
      if (allDone.length > 0) {
        var totalDur = allDone.reduce(function(acc, cur) { return acc + (parseFloat(cur.durationDays) || 0); }, 0);
        avgSla = (totalDur / allDone.length).toFixed(1).replace('.', ',') + "d";
      }

      if (document.getElementById('kpiTotalOpen')) document.getElementById('kpiTotalOpen').innerText = allOpen.length;
      if (document.getElementById('kpiOnTime')) document.getElementById('kpiOnTime').innerText = onTimeCount;
      if (document.getElementById('kpiOverdue')) document.getElementById('kpiOverdue').innerText = urgentCount;
      if (document.getElementById('kpiOverdueSub')) {
        document.getElementById('kpiOverdueSub').innerText = filterOnlyOverdue ? "Filtro ativo (clique p/ sair)" : "Clique para filtrar críticos";
      }
      if (document.getElementById('kpiFinalizedMonth')) document.getElementById('kpiFinalizedMonth').innerText = allDone.length;
      if (document.getElementById('kpiOverallSla')) document.getElementById('kpiOverallSla').innerText = avgSla;

      var inProg = allOpen.filter(function(t) {
        if (filterOnlyOverdue && !getRemainingTime(t.returnDate).isUrgent) return false;
        return true;
      });

      var lbl = document.getElementById('inProgressCountLabel');
      if (lbl) lbl.innerText = '(' + inProg.length + ' em aberto)';

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

      var tbody = document.getElementById('recordsTableBody');
      if (!tbody) return;
      tbody.innerHTML = '';

      if (allDone.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:22px; color:var(--text-subtle);">Nenhuma demanda finalizada para os filtros selecionados.</td></tr>';
        return;
      }

      allDone.forEach(function(r) {
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
          tdProd.textContent = normalizeProduct(r.product);

          var tdSol = document.createElement('td');
          tdSol.textContent = r.solicitacao || '-';

          var tdTerc = document.createElement('td');
          tdTerc.style.cssText = 'color:#38BDF8; font-weight:700;';
          tdTerc.textContent = r.terceiro || '-';

          var tdSla = document.createElement('td');
          tdSla.innerHTML = '<span style="font-size:11px; font-weight:800; color:var(--tp-green); background:rgba(0,214,89,0.14); padding:2px 7px; border-radius:4px;">✓ ' + escapeHtml(slaText) + '</span>';

          var tdOp = document.createElement('td');
          tdOp.style.cssText = 'color:var(--text-muted); font-weight:600;';
          tdOp.textContent = r.operator || '-';

          var tdAct = document.createElement('td');
          tdAct.style.textAlign = 'center';
          tdAct.onclick = function(e) { e.stopPropagation(); };
          var delBtn = document.createElement('button');
          delBtn.className = 'btn-row-delete';
          delBtn.textContent = 'Excluir';
          delBtn.onclick = function(e) { deleteTicketById(e, r.id); };
          tdAct.appendChild(delBtn);

          tr.appendChild(tdDate);
          tr.appendChild(tdEnd);
          tr.appendChild(tdClient);
          tr.appendChild(tdProd);
          tr.appendChild(tdSol);
          tr.appendChild(tdTerc);
          tr.appendChild(tdSla);
          tr.appendChild(tdOp);
          tr.appendChild(tdAct);

          tbody.appendChild(tr);
        } catch(errRow) {
          console.warn("Erro ao renderizar linha finalizada:", errRow);
        }
      });
    }

    function renderProductCardsColumn(containerId, list, prodClass) {
      var container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = '';

      if (list.length === 0) {
        container.innerHTML = '<div style="padding:20px 8px; text-align:center; color:var(--text-subtle); font-size:11px;">Sem demandas em aberto.</div>';
        return;
      }

      list.forEach(function(t) {
        try {
          var cleanRetDate = formatOnlyDateBR(t.returnDate);
          var rem = getRemainingTime(cleanRetDate);
          var elapsed = getElapsedTime(t.startDate);
          var returnLabel = (t.isAutoReturn === true || t.isAutoReturn === "true") ? "Retorno médio esperado" : "Retorno em";

          var card = document.createElement('div');
          card.className = 'progress-card ' + prodClass;
          card.onclick = function() { openDrawer(t); };
          card.innerHTML = 
            '<div class="card-top-meta">' +
              '<div class="card-client-title" title="' + escapeHtml(t.client) + '">' + escapeHtml(t.client || 'Sem Nome') + '</div>' +
              '<span class="card-agent-pill">' + escapeHtml(t.operator || '') + '</span>' +
            '</div>' +
            '<div class="card-solicitation-line">' +
              '<span><strong>' + escapeHtml(t.solicitacao || '') + '</strong> • ' + escapeHtml(t.terceiro || '') + '</span>' +
            '</div>' +
            '<div class="timers-box">' +
              '<div class="timer-item">' +
                '<span class="timer-label">' + returnLabel + '</span>' +
                '<span class="timer-val ' + rem.class + '">' + escapeHtml(cleanRetDate || '-') + ' <small style="font-weight:normal; font-size:10px;">(' + rem.text + ')</small></span>' +
              '</div>' +
              '<div class="timer-item">' +
                '<span class="timer-label">Tempo em Aberto</span>' +
                '<span class="timer-val" style="color:var(--tp-green);">' + elapsed + '</span>' +
              '</div>' +
            '</div>';
          container.appendChild(card);
        } catch(errCard) {
          console.warn("Erro ao renderizar card:", errCard);
        }
      });
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
        document.getElementById('drawerProductBadge').innerText = normalizeProduct(ticket.product);
        document.getElementById('drawerSolicitationBadge').innerText = String(ticket.solicitacao || "SOLICITAÇÃO");
        document.getElementById('drawerStatusVal').innerText = String(ticket.status || "-");
        document.getElementById('drawerAgentVal').innerText = String(ticket.operator || "-");
        document.getElementById('drawerThirdVal').innerText = String(ticket.terceiro || "-");
        document.getElementById('drawerDescVal').innerText = String(ticket.description || "Nenhum relato ou informação adicional informada.");

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
        document.getElementById('btnToggleEdit').style.display = isOpen ? 'block' : 'none';
        
        var displayStart = formatDateDisplay(ticket.startDate);
        document.getElementById('step1Time').innerText = displayStart;
        document.getElementById('step2Time').innerText = displayStart;
        document.getElementById('step2Title').innerText = 'Acionado ' + String(ticket.terceiro || 'Terceiro');
        document.getElementById('step2Desc').innerText = normalizeProduct(ticket.product) === 'PEDÁGIO' ? 'Aguardando parecer técnico / laudo de rodovia.' : 'Aguardando validação técnica e retorno do terceiro.';

        var step3 = document.getElementById('step3Container');
        var step3Time = document.getElementById('step3Time');
        var slaHighlight = document.getElementById('slaFinalHighlight');
        var clocksBox = document.getElementById('drawerProgressClocks');

        var cleanRet = formatOnlyDateBR(ticket.returnDate);

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

          var rem = getRemainingTime(cleanRet);
          var elapsed = getElapsedTime(ticket.startDate);
          var returnHeaderLabel = (ticket.isAutoReturn === true || ticket.isAutoReturn === "true") ? "Retorno Médio Esperado" : "Retorno em";
          document.getElementById('drawerClockRem').innerText = returnHeaderLabel + ': ' + (cleanRet || '-') + ' (' + rem.text + ')';
          document.getElementById('drawerClockElapsed').innerText = 'Total em processo: ' + elapsed;
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
          { v: 'Chamado T.I', l: 'Chamado T.I' },
          { v: 'Isenção', l: 'Isenção' },
          { v: 'Logistica', l: 'Logística' },
          { v: 'Cancelamento', l: 'Cancelamento' },
          { v: 'Cobrança fora da TAG', l: 'Cobrança fora da TAG' }
        ];
      } else if (prod === 'MANUTENÇÃO') {
        options = [
          { v: 'Chamado T.I', l: 'Chamado T.I' },
          { v: 'Outros', l: 'Outros' }
        ];
      } else {
        options = [
          { v: 'Logistica', l: 'Logística' },
          { v: 'Chamado T.I', l: 'Chamado T.I' },
          { v: 'Isenção', l: 'Isenção' }
        ];
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
      else if (prod === 'MANUTENÇÃO') terceiroSel.value = 'Financeiro';
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

      var needsLink = ['Contestação', 'Isenção', 'Cancelamento', 'Cobrança fora da TAG', 'Chamado T.I'].indexOf(sol) !== -1;
      
      if (needsLink) {
        linkGroup.style.display = 'block';
        if (sol === 'Chamado T.I') linkLabel.innerText = 'Link Card Bitrix * (Obrigatório)';
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

      if (sol === 'Chamado T.I') terceiroSel.value = 'T.I';
      else if (['Contestação', 'Cancelamento', 'Cobrança fora da TAG'].indexOf(sol) !== -1) terceiroSel.value = 'MoveMais';
      else if (sol === 'Isenção') terceiroSel.value = 'Financeiro';
      else if (sol === 'Logistica') terceiroSel.value = 'Cadastro';
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

      if (editForm.style.display === 'flex') {
        editForm.style.display = 'none';
        detailGrid.style.display = 'grid';
      } else {
        refreshOperatorDropdowns();
        var prod = normalizeProduct(activeSelectedTicket.product);
        document.getElementById('editDrawerClient').value = activeSelectedTicket.client || "";
        document.getElementById('editDrawerProduct').value = prod;
        populateSolicitacaoOptions(document.getElementById('editDrawerSolicitacao'), prod, activeSelectedTicket.solicitacao);
        document.getElementById('editDrawerContact').value = activeSelectedTicket.contact || "";
        document.getElementById('editDrawerOperator').value = activeSelectedTicket.operator || getActiveOperator();
        document.getElementById('editDrawerTerceiro').value = activeSelectedTicket.terceiro || "MoveMais";
        document.getElementById('editDrawerReturnDate').value = formatOnlyDateBR(activeSelectedTicket.returnDate);
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
      var newDesc = document.getElementById('editDrawerDescription').value.trim();
      var newLink = document.getElementById('editDrawerLink').value.trim();
      var newDafRede = newProd === 'MANUTENÇÃO' ? document.getElementById('editDrawerDafRede').value : "";
      var newDafMuni = newProd === 'MANUTENÇÃO' ? document.getElementById('editDrawerDafMuni').value : "";

      var needsLink = ['Contestação', 'Isenção', 'Cancelamento', 'Cobrança fora da TAG', 'Chamado T.I'].indexOf(newSol) !== -1;
      if (needsLink && !newLink) {
        showToast("O Link Externo (E-mail ou Bitrix) é obrigatório.", true);
        return;
      }
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
        terceiro: newTerceiro,
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
        terceiroSel.value = 'Financeiro';
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

    function onModalServiceChange() {
      var serv = document.getElementById('modalServiceSelect').value;
      var prod = normalizeProduct(document.getElementById('modalProductSelect').value);
      var linkGroup = document.getElementById('modalLinkGroup');
      var linkLabel = document.getElementById('modalLinkLabel');
      var descLabel = document.getElementById('modalDescLabel');
      var terceiroSel = document.getElementById('modalTerceiroSelect');

      var needsLink = ['Contestação', 'Isenção', 'Cancelamento', 'Cobrança fora da TAG', 'Chamado T.I'].indexOf(serv) !== -1;
      
      if (needsLink) {
        linkGroup.style.display = 'block';
        if (serv === 'Chamado T.I') linkLabel.innerText = 'Link Card Bitrix * (Obrigatório)';
        else linkLabel.innerText = 'Link do E-mail / Chamado Externo * (Obrigatório)';
      } else {
        linkGroup.style.display = 'none';
      }

      if (prod === 'MANUTENÇÃO' && serv === 'Outros') {
        descLabel.innerText = 'Descrição detalhada do Assunto * (Obrigatório)';
        descLabel.style.color = '#F59E0B';
      } else {
        descLabel.innerText = 'Informações Complementares / Ocorrência no IP';
        descLabel.style.color = '#E2E8F0';
      }

      if (serv === 'Chamado T.I') terceiroSel.value = 'T.I';
      else if (['Contestação', 'Cancelamento', 'Cobrança fora da TAG'].indexOf(serv) !== -1) terceiroSel.value = 'MoveMais';
      else if (serv === 'Isenção') terceiroSel.value = 'Financeiro';
      else if (serv === 'Logistica') terceiroSel.value = 'Cadastro';

      if (serv === 'Isenção') {
        document.getElementById('modalFeedbackText').innerText = '💡 Dica: Para Isenção, defina a data próxima ao fechamento.';
      } else if (!modalAutoReturnFlag) {
        document.getElementById('modalFeedbackText').innerText = '';
      }
    }

    function markManualReturnDate() {
      modalAutoReturnFlag = false;
      document.getElementById('modalFeedbackText').innerText = 'Data de retorno agendada manualmente ("Retorno em").';
    }

    function calculateModalReturnDate() {
      var currentStats = calcCurrentSlaStats();
      var serv = document.getElementById('modalServiceSelect').value;
      var mean = currentStats[serv] && currentStats[serv].mean > 0 ? parseFloat(currentStats[serv].mean) : 10;
      
      var now = new Date();
      now.setDate(now.getDate() + Math.ceil(mean));
      var y = now.getFullYear();
      var m = String(now.getMonth() + 1).padStart(2, '0');
      var d = String(now.getDate()).padStart(2, '0');

      document.getElementById('modalReturnDateInput').value = y + '-' + m + '-' + d;
      modalAutoReturnFlag = true;
      document.getElementById('modalFeedbackText').innerText = 'Retorno médio esperado calculado: +' + Math.ceil(mean) + ' dias.';
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

      var needsLink = ['Contestação', 'Isenção', 'Cancelamento', 'Cobrança fora da TAG', 'Chamado T.I'].indexOf(serv) !== -1;
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
        terceiro: f.terceiro.value,
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
      var s = String(t.solicitacao || "").trim();
      if (p === 'PEDÁGIO') {
        if (s === 'Cancelamento') return 'Pedágio MoveMais - Cancelamento';
        if (s === 'Contestação') return 'Pedágio MoveMais - Contestação';
        if (s === 'Isenção') return 'Pedágio Financeiro - Isenção';
        if (s === 'Chamado T.I') return 'Pedágio T.I - Chamado T.I';
        if (s === 'Cobrança fora da TAG') return 'Pedágio MoveMais - Cobrança fora da TAG';
        if (s === 'Logistica') return 'Pedágio Cadastro - Logística';
        return 'Pedágio - ' + s;
      }
      if (p === 'MANUTENÇÃO') {
        if (s === 'Chamado T.I') return 'Manutenção T.I - Chamado T.I';
        if (s === 'Outros') return 'Manutenção Financeiro - Outros';
        return 'Manutenção - ' + s;
      }
      if (p === 'ABASTECIMENTO') {
        if (s === 'Logistica') return 'Abastecimento Cadastro - Logística';
        if (s === 'Chamado T.I') return 'Abastecimento T.I - Chamado T.I';
        if (s === 'Isenção') return 'Abastecimento Financeiro - Isenção';
        return 'Abastecimento - ' + s;
      }
      return p + ' - ' + s;
    }

    function renderSlaReport() {
      // 1. SLA por Produto
      var prodStats = calcProductSlaStats();
      var prodTbody = document.getElementById('productSlaTableBody');
      if (prodTbody) {
        prodTbody.innerHTML = '';
        Object.keys(prodStats).forEach(function(p) {
          var row = prodStats[p];
          var grad = getSlaGradientColors(row.mean);
          var tr = document.createElement('tr');
          tr.innerHTML = 
            '<td style="font-weight:800; color:#fff;">' + p + '</td>' +
            '<td>' + row.count + ' chamados</td>' +
            '<td><span class="sla-pill-gradient" style="color:' + grad.color + '; background:' + grad.bg + '; border:1px solid ' + grad.border + ';">' + (row.count > 0 ? String(row.mean).replace('.', ',') + ' d' : '-') + '</span></td>' +
            '<td style="color:#CBD5E1; font-family:monospace;">' + (row.count > 0 ? String(row.median).replace('.', ',') + ' d' : '-') + '</td>';
          prodTbody.appendChild(tr);
        });
      }

      // 2. Gráfico e Tabela Detalhada por Categoria Específica
      var completed = allTickets.filter(function(t) { return t.status === 'Concluído' && t.durationDays !== null && !isNaN(parseFloat(t.durationDays)); });

      var extVals = [];
      var intVals = [];
      completed.forEach(function(t) {
        var d = parseFloat(t.durationDays);
        var terc = String(t.terceiro || "").toLowerCase();
        if (terc.indexOf('movemais') !== -1 || terc.indexOf('connect') !== -1) extVals.push(d);
        else intVals.push(d);
      });
      if (document.getElementById('slaExternoMedia')) {
        var eMean = extVals.length ? (extVals.reduce(function(a,b){return a+b;},0)/extVals.length).toFixed(1).replace('.', ',') + ' dias' : '16,3 dias';
        document.getElementById('slaExternoMedia').innerText = eMean;
      }
      if (document.getElementById('slaInternoMedia')) {
        var iMean = intVals.length ? (intVals.reduce(function(a,b){return a+b;},0)/intVals.length).toFixed(1).replace('.', ',') + ' dias' : '11,6 dias';
        document.getElementById('slaInternoMedia').innerText = iMean;
      }
      
      var catMap = {};
      completed.forEach(function(t) {
        var cat = getBiCategory(t);
        if (!catMap[cat]) catMap[cat] = { count: 0, sum: 0, vals: [], terceiro: t.terceiro };
        var d = parseFloat(t.durationDays);
        catMap[cat].count++;
        catMap[cat].sum += d;
        catMap[cat].vals.push(d);
      });

      var catList = Object.keys(catMap).map(function(k) {
        return { 
          name: k, 
          count: catMap[k].count, 
          mean: (catMap[k].sum / catMap[k].count), 
          median: calcMedian(catMap[k].vals),
          terc: catMap[k].terceiro 
        };
      }).sort(function(a,b) { return b.count - a.count; });

      var container = document.getElementById('chartBarsContainer');
      if (container) {
        container.innerHTML = '';
        catList.forEach(function(c) {
          var grad = getSlaGradientColors(c.mean);
          var row = document.createElement('div');
          row.className = 'chart-bar-item';
          row.innerHTML = 
            '<span class="bar-label" title="' + escapeHtml(c.name) + '">' + escapeHtml(c.name) + '</span>' +
            '<div class="bar-track">' +
              '<div class="bar-fill" style="width: ' + grad.pct + '%; background:' + grad.color + ';"></div>' +
            '</div>' +
            '<span class="bar-value" style="color:' + grad.color + ';">' + c.mean.toFixed(1).replace('.', ',') + ' d</span>';
          container.appendChild(row);
        });
      }

      var tbody = document.getElementById('partnerMatrixTableBody');
      if (tbody) {
        tbody.innerHTML = '';
        catList.forEach(function(c) {
          var grad = getSlaGradientColors(c.mean);
          var tr = document.createElement('tr');
          tr.innerHTML = 
            '<td style="font-weight:800; color:#fff;">' + escapeHtml(c.name) + '</td>' +
            '<td style="color:#38BDF8; font-weight:700;">' + escapeHtml(c.terc) + '</td>' +
            '<td>' + c.count + ' chamados</td>' +
            '<td>' +
              '<div style="display:flex; align-items:center; gap:8px;">' +
                '<span class="sla-pill-gradient" style="color:' + grad.color + '; background:' + grad.bg + '; border:1px solid ' + grad.border + ';">' + c.mean.toFixed(1).replace('.', ',') + ' d</span>' +
              '</div>' +
              '<div class="mini-track"><div class="mini-fill" style="width:' + grad.pct + '%; background:' + grad.color + ';"></div></div>' +
            '</td>' +
            '<td style="color:#CBD5E1; font-family:monospace; font-weight:700;">' + c.median.toFixed(1).replace('.', ',') + ' d</td>';
          tbody.appendChild(tr);
        });
      }
    }

