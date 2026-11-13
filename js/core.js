// TOAST NOTIFICATION (AVISO DISCRETO E NÃO-BLOQUEANTE)
    // =========================================================================
    function showToast(message, isWarn) {
      var container = document.getElementById('toastContainer');
      if (!container) return;
      var el = document.createElement('div');
      el.className = 'toast-msg' + (isWarn ? ' warn' : '');
      el.innerHTML = '<span>' + (isWarn ? '⚠️' : '✓') + '</span><span>' + escapeHtml(message) + '</span>';
      container.appendChild(el);
      requestAnimationFrame(function() {
        el.classList.add('show');
      });
      setTimeout(function() {
        el.classList.remove('show');
        setTimeout(function() {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 250);
      }, 2500);
    }

    // =========================================================================
    // UTILITÁRIOS DE DATA E NORMALIZAÇÃO (INCLUINDO parseDateBR)
    // =========================================================================
    function escapeHtml(str) {
      if (str === null || str === undefined) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function parseDateBR(str) {
      if (!str) return null;
      var s = String(str).trim();
      if (!s || s === "-" || s === "null" || s === "undefined") return null;
      if (s.indexOf('T') !== -1) {
        var dtIso = new Date(s);
        return isNaN(dtIso.getTime()) ? null : dtIso;
      }
      if (s.indexOf('/') !== -1) {
        var parts = s.split(' ');
        var dmy = parts[0].split('/');
        if (dmy.length < 3) return null;
        var hm = parts[1] ? parts[1].split(':') : [0, 0];
        var dtBr = new Date(
          parseInt(dmy[2], 10),
          parseInt(dmy[1], 10) - 1,
          parseInt(dmy[0], 10),
          parseInt(hm[0] || 0, 10),
          parseInt(hm[1] || 0, 10)
        );
        return isNaN(dtBr.getTime()) ? null : dtBr;
      }
      var dtFallback = new Date(s);
      return isNaN(dtFallback.getTime()) ? null : dtFallback;
    }

    function formatOnlyDateBR(d) {
      if (!d) return "";
      var s = String(d).trim();
      if (!s || s === "-" || s === "A definir" || s === "null" || s === "undefined") return s === "A definir" ? "A definir" : "";

      var brMatch = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
      if (brMatch) {
        return brMatch[1] + "/" + brMatch[2] + "/" + brMatch[3];
      }

      var isoDateOnly = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoDateOnly) {
        return isoDateOnly[3] + "/" + isoDateOnly[2] + "/" + isoDateOnly[1];
      }

      if (s.indexOf('T') !== -1) {
        if (s.indexOf('T00:00:00') !== -1) {
          var p0 = s.split('T')[0].split('-');
          if (p0.length === 3) return p0[2] + "/" + p0[1] + "/" + p0[0];
        }
        var dt = new Date(s);
        if (!isNaN(dt.getTime())) {
          var dd = String(dt.getDate()).padStart(2, '0');
          var mm = String(dt.getMonth() + 1).padStart(2, '0');
          var yyyy = dt.getFullYear();
          return dd + "/" + mm + "/" + yyyy;
        }
      }
      return s;
    }

    function formatDateDisplay(d) {
      if (!d) return "-";
      var s = String(d).trim();
      if (s.indexOf('T') !== -1) {
        var dt = new Date(s);
        if (!isNaN(dt.getTime())) {
          var dd = String(dt.getDate()).padStart(2, '0');
          var mm = String(dt.getMonth() + 1).padStart(2, '0');
          var yyyy = dt.getFullYear();
          var hh = String(dt.getHours()).padStart(2, '0');
          var min = String(dt.getMinutes()).padStart(2, '0');
          return dd + "/" + mm + "/" + yyyy + " " + hh + ":" + min;
        }
      }
      return s;
    }

    function normalizeProduct(p) {
      var raw = String(p || "").trim().toUpperCase();
      if (raw.indexOf("ABAST") !== -1) return "ABASTECIMENTO";
      if (raw.indexOf("MANUT") !== -1) return "MANUTENÇÃO";
      if (raw.indexOf("PED") !== -1) return "PEDÁGIO";
      return raw || "PEDÁGIO";
    }

    function normalizeStatus(st) {
      var raw = String(st || "").trim().toLowerCase();
      if (raw.indexOf("concl") !== -1) return "Concluído";
      if (raw.indexOf("canc") !== -1) return "Cancelado";
      return "Em andamento";
    }

    function normalizeMes(m) {
      if (!m) return "11-2026";
      var s = String(m).trim().toLowerCase();
      if (s.indexOf("11") !== -1 || s.indexOf("nov") !== -1) return "11-2026";
      if (s.indexOf("10") !== -1 || s.indexOf("out") !== -1) return "10-2026";
      if (s.indexOf("09") !== -1 || s.indexOf("set") !== -1 || s.indexOf("9") !== -1) return "09-2026";
      if (s.indexOf("08") !== -1 || s.indexOf("ago") !== -1 || s.indexOf("8") !== -1) return "08-2026";
      if (s.indexOf("07") !== -1 || s.indexOf("jul") !== -1 || s.indexOf("7") !== -1) return "07-2026";
      return "11-2026";
    }

    function isBlacklisted(ticket) {
      if (!ticket) return false;
      var id = String(ticket.id || ticket['id'] || ticket['ID'] || "").trim();
      var client = String(ticket.client || ticket['Cliente'] || "").trim().toLowerCase();
      return (id === "REC-090" || client.indexOf("knbei") !== -1);
    }

    // =========================================================================
    // GESTÃO DE OPERADOR ATIVO & ESCALABILIDADE DA EQUIPE
    // =========================================================================
    function getTeamList() {
      var defaults = ["Leandro", "Mirian", "Isabelli"];
      try {
        var saved = localStorage.getItem(TEAM_LIST_KEY);
        if (saved) {
          var arr = JSON.parse(saved);
          if (Array.isArray(arr) && arr.length > 0) return arr;
        }
      } catch(e) {}
      return defaults;
    }

    function saveTeamList(list) {
      try { localStorage.setItem(TEAM_LIST_KEY, JSON.stringify(list)); } catch(e) {}
    }

    function getActiveOperator() {
      try {
        var op = localStorage.getItem(OPERATOR_KEY);
        if (op) return op;
      } catch(e) {}
      return "Leandro";
    }

    function setActiveOperator(name) {
      try { localStorage.setItem(OPERATOR_KEY, name); } catch(e) {}
    }

    function refreshOperatorDropdowns() {
      var team = getTeamList();
      var active = getActiveOperator();
      if (team.indexOf(active) === -1) {
        team.push(active);
        saveTeamList(team);
      }

      var topSel = document.getElementById('activeOperatorSelect');
      if (topSel) {
        topSel.innerHTML = team.map(function(m) {
          return '<option value="' + escapeHtml(m) + '">' + escapeHtml(m) + '</option>';
        }).join('') + '<option value="__NEW__">+ Novo Operador...</option>';
        topSel.value = active;
      }

      var filtSel = document.getElementById('filterAgentSelect');
      if (filtSel) {
        var curFilt = filtSel.value;
        filtSel.innerHTML = '<option value="">Agente: Todos</option>' + team.map(function(m) {
          return '<option value="' + escapeHtml(m) + '">' + escapeHtml(m) + '</option>';
        }).join('');
        filtSel.value = curFilt;
      }

      ['modalOperatorSelect', 'editDrawerOperator'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) {
          var cur = el.value;
          el.innerHTML = team.map(function(m) {
            return '<option value="' + escapeHtml(m) + '">' + escapeHtml(m) + '</option>';
          }).join('');
          if (cur && team.indexOf(cur) !== -1) el.value = cur;
        }
      });
    }

    function handleActiveOperatorChange() {
      var sel = document.getElementById('activeOperatorSelect');
      if (!sel) return;
      if (sel.value === '__NEW__') {
        var newName = prompt("Digite o nome do novo integrante da equipe:");
        if (newName && newName.trim()) {
          var clean = newName.trim();
          var team = getTeamList();
          if (team.indexOf(clean) === -1) {
            team.push(clean);
            saveTeamList(team);
          }
          setActiveOperator(clean);
          refreshOperatorDropdowns();
          showToast("Operador ativo alterado para " + clean);
        } else {
          sel.value = getActiveOperator();
        }
        return;
      }
      setActiveOperator(sel.value);
      showToast("Sessão ativa: " + sel.value);
    }

    // =========================================================================
    // PERSISTÊNCIA À PROVA DE FALHAS (TOMBSTONES + FILA DE MUTAÇÕES PENDENTES)
    // =========================================================================
    function getDeletedIds() {
      var base = ["REC-090", "knbei", "knbei lucas"];
      try {
        var raw = localStorage.getItem(TOMBSTONE_KEY);
        if (raw) {
          var arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            arr.forEach(function(item) {
              if (base.indexOf(item) === -1) base.push(item);
            });
          }
        }
      } catch(e) {}
      return base;
    }

    function saveDeletedIds(arr) {
      try { localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(arr)); } catch(e) {}
    }

    function isDeletedTicket(ticket, delList) {
      if (!ticket) return false;
      if (isBlacklisted(ticket)) return true;
      var list = delList || getDeletedIds();
      var tid = String(ticket.id || ticket['id'] || ticket['ID'] || "").trim();
      return tid ? (list.indexOf(tid) !== -1) : false;
    }

    function getPendingOps() {
      try {
        var raw = localStorage.getItem(PENDING_KEY);
        if (raw) {
          var obj = JSON.parse(raw);
          if (obj && typeof obj === "object") return obj;
        }
      } catch(e) {}
      return {};
    }

    function savePendingOps(ops) {
      try { localStorage.setItem(PENDING_KEY, JSON.stringify(ops)); } catch(e) {}
    }

    function registerPendingOp(actionType, ticket) {
      if (!ticket || !ticket.id) return;
      var ops = getPendingOps();
      ops[String(ticket.id).trim()] = {
        action: actionType,
        ticket: ticket,
        timestamp: Date.now(),
        confirmed: false
      };
      savePendingOps(ops);
    }

    function confirmPendingOp(ticketId) {
      if (!ticketId) return;
      var ops = getPendingOps();
      var key = String(ticketId).trim();
      if (ops[key]) {
        ops[key].confirmed = true;
        ops[key].confirmedAt = Date.now();
        savePendingOps(ops);
      }
    }

    function pruneConfirmedOps() {
      var ops = getPendingOps();
      var now = Date.now();
      var changed = false;
      Object.keys(ops).forEach(function(k) {
        if (ops[k].confirmed && (now - (ops[k].confirmedAt || ops[k].timestamp) > 15000)) {
          delete ops[k];
          changed = true;
        }
      });
      if (changed) savePendingOps(ops);
      return ops;
    }

    function getStoredTickets() {
      var delList = getDeletedIds();
      var map = {};

      RAW_INITIAL_RECORDS.forEach(function(r) {
        if (!isDeletedTicket(r, delList)) {
          var copy = Object.assign({}, r);
          copy.returnDate = formatOnlyDateBR(copy.returnDate);
          map[r.id] = copy;
        }
      });

      try {
        var saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          var parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            parsed.forEach(function(t) {
              if (t && t.id && !isDeletedTicket(t, delList)) {
                t.product = normalizeProduct(t.product);
                t.status = normalizeStatus(t.status);
                t.returnDate = formatOnlyDateBR(t.returnDate);
                map[t.id] = t;
              }
            });
          }
        }
      } catch(e) {}

      var ops = getPendingOps();
      Object.keys(ops).forEach(function(id) {
        var op = ops[id];
        if (op.action === "delete") {
          delete map[id];
        } else if (op.ticket && !isDeletedTicket(op.ticket, delList)) {
          op.ticket.returnDate = formatOnlyDateBR(op.ticket.returnDate);
          map[id] = op.ticket;
        }
      });

      return Object.keys(map).map(function(k) { return map[k]; });
    }

    function saveStoredTickets() {
      var delList = getDeletedIds();
      var clean = allTickets.filter(function(t) { return !isDeletedTicket(t, delList); });
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(clean)); } catch(e) {}
    }

    var allTickets = getStoredTickets();
    var activeSelectedTicket = null;
    var modalAutoReturnFlag = false;
    var filterOnlyOverdue = false;
    var isSyncingNow = false;

    function mapSheetRowToTicket(row) {
      var tid = String(row.id || row['ID'] || row['Código'] || "").trim();
      var client = String(row.client || row['Cliente'] || "").trim();
      var prod = normalizeProduct(row.product || row['Produto'] || "PEDÁGIO");
      var st = normalizeStatus(row.status || row['Status'] || "Em andamento");
      var sol = String(row.solicitacao || row['Solicitação'] || "Contestação").trim();
      var terceiro = String(row.terceiro || row['Terceiro'] || "MoveMais").trim();
      var op = String(row.operator || row['Responsável'] || "Leandro").trim();
      var contact = String(row.contact || row['Contato'] || "").trim();
      var bitrix = String(row.bitrixLink || row['Bitrix'] || "").trim();
      var dafRede = String(row.dafRede || row['Casa DAF'] || "").trim();
      var dafMuni = String(row.dafMunicipio || row['Município'] || "").trim();
      var desc = String(row.description || row['Descrição'] || "").trim();
      var start = formatDateDisplay(row.startDate || row['Data de início'] || "");
      var end = formatDateDisplay(row.endDate || row['Data de término'] || "");
      var ret = formatOnlyDateBR(row.returnDate || row['Data de Retorno'] || "");
      var dur = (row.durationDays !== undefined && row.durationDays !== null && row.durationDays !== "") ? parseFloat(row.durationDays) : null;
      var mes = normalizeMes(row.mes || row['Mês'] || start);
      var isAuto = row.isAutoReturn === true || row.isAutoReturn === "true";

      return {
        id: tid,
        mes: mes,
        operator: op,
        product: prod,
        client: client,
        contact: contact,
        solicitacao: sol,
        terceiro: terceiro,
        bitrixLink: bitrix,
        dafRede: dafRede,
        dafMunicipio: dafMuni,
        status: st,
        startDate: start === "-" ? "" : start,
        endDate: end === "-" ? "" : end,
        durationDays: isNaN(dur) ? null : dur,
        returnDate: ret,
        isAutoReturn: isAuto,
        description: desc,
        updatedAt: String(row.updatedAt || "")
      };
    }

    function setSyncBadge(state, text) {
      var ind = document.getElementById('syncStatusIndicator');
      if (!ind) return;
      ind.className = 'sync-status' + (state ? ' ' + state : '');
      ind.innerText = text;
    }

    function flushPendingOps() {
      var ops = pruneConfirmedOps();
      var unconfirmedIds = Object.keys(ops).filter(function(id) { return !ops[id].confirmed; });
      if (unconfirmedIds.length === 0) return Promise.resolve();

      var promises = unconfirmedIds.map(function(id) {
        var op = ops[id];
        return sendMutationToSheet(op.action, op.ticket, true);
      });
      return Promise.all(promises);
    }

    function sendMutationToSheet(actionType, ticketData, isRetry) {
      if (!isRetry) {
        registerPendingOp(actionType, ticketData);
      }
      setSyncBadge('syncing', '⏳ Salvando...');

      var cleanPayloadTicket = Object.assign({}, ticketData, {
        returnDate: formatOnlyDateBR(ticketData.returnDate)
      });

      return fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: actionType,
          ticket: cleanPayloadTicket
        })
      })
      .then(function(res) { return res.text(); })
      .then(function() {
        confirmPendingOp(ticketData.id);
        setSyncBadge('', '↻ ● Sincronizado');
      })
      .catch(function(err) {
        console.warn("Falha temporária no envio:", err);
        setSyncBadge('offline', '↻ ● Pendente');
      });
    }

    function syncFromGoogleSheets(isManualClick) {
      if (isSyncingNow) return;
      isSyncingNow = true;
      setSyncBadge('syncing', '⏳ Sincronizando...');

      flushPendingOps().then(function() {
        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, 10000);

        return fetch(GOOGLE_SCRIPT_URL + "?t=" + Date.now(), {
          signal: controller.signal,
          cache: "no-store"
        }).then(function(res) {
          clearTimeout(timeoutId);
          return res.json();
        });
      })
      .then(function(resp) {
        isSyncingNow = false;
        if (!resp || resp.status !== "success") {
          setSyncBadge('', '↻ ● Sincronizado');
          return;
        }

        var delList = getDeletedIds();
        if (Array.isArray(resp.deletedIds)) {
          resp.deletedIds.forEach(function(did) {
            var cleanDid = String(did || "").trim();
            if (cleanDid && delList.indexOf(cleanDid) === -1) {
              delList.push(cleanDid);
            }
          });
          saveDeletedIds(delList);
        }

        var sheetMap = {};
        if (Array.isArray(resp.data)) {
          resp.data.map(mapSheetRowToTicket).forEach(function(t) {
            if (t.id && !isDeletedTicket(t, delList)) {
              sheetMap[t.id] = t;
            }
          });
        }

        var activePending = pruneConfirmedOps();
        var mergedMap = {};

        RAW_INITIAL_RECORDS.forEach(function(r) {
          if (!isDeletedTicket(r, delList)) {
            var copy = Object.assign({}, r);
            copy.returnDate = formatOnlyDateBR(copy.returnDate);
            mergedMap[r.id] = copy;
          }
        });

        Object.keys(sheetMap).forEach(function(id) {
          mergedMap[id] = sheetMap[id];
        });

        allTickets.forEach(function(localTicket) {
          var lid = String(localTicket.id || "").trim();
          if (!lid || isDeletedTicket(localTicket, delList)) return;

          if (activePending[lid]) {
            if (activePending[lid].action === "delete") {
              delete mergedMap[lid];
            } else if (activePending[lid].ticket) {
              mergedMap[lid] = activePending[lid].ticket;
            }
          }
        });

        var nextList = Object.keys(mergedMap).map(function(k) { return mergedMap[k]; });
        nextList.sort(function(a, b) {
          var da = parseDateBR(a.startDate);
          var db = parseDateBR(b.startDate);
          return (db ? db.getTime() : 0) - (da ? da.getTime() : 0);
        });

        allTickets = nextList;
        saveStoredTickets();
        setSyncBadge('', '↻ ● Sincronizado');
        renderAll();
        if (isManualClick) showToast("Base sincronizada com a equipe!");

        if (activeSelectedTicket) {
          var editForm = document.getElementById('drawerEditForm');
          if (!editForm || editForm.style.display !== 'flex') {
            var refreshed = allTickets.find(function(x) { return x.id === activeSelectedTicket.id; });
            if (refreshed) {
              openDrawer(refreshed, true);
            } else {
              closeDrawerDirect();
            }
          }
        }
      })
      .catch(function(err) {
        isSyncingNow = false;
        console.warn("Sincronização offline:", err);
        setSyncBadge('offline', '↻ ● Offline');
      });
    }

    function manualSyncNow() {
      syncFromGoogleSheets(true);
    }

    setInterval(function() {
      var modalOpen = document.getElementById('modalOverlay').style.display === 'flex';
      var editOpen = document.getElementById('drawerEditForm').style.display === 'flex';
      if (!modalOpen && !editOpen) {
        syncFromGoogleSheets(false);
      }
    }, 20000);

    // =========================================================================
