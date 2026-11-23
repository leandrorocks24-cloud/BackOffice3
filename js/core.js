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
      if (raw.indexOf("excl") !== -1 || raw.indexOf("delet") !== -1 || raw.indexOf("remov") !== -1) return "Excluído";
      if (raw.indexOf("concl") !== -1 || raw.indexOf("finaliz") !== -1 || raw.indexOf("encerr") !== -1 || raw.indexOf("resolv") !== -1) return "Concluído";
      if (raw.indexOf("canc") !== -1) return "Cancelado";
      return "Em andamento";
    }

    function normalizeMes(m) {
      if (!m) return "11-2026";
      var s = String(m).trim().toLowerCase();
      var mmYyyy = s.match(/^(\d{2})-(\d{4})$/);
      if (mmYyyy) return mmYyyy[1] + "-" + mmYyyy[2];
      if (s.indexOf("12") !== -1 || s.indexOf("dez") !== -1) return "12-2026";
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
      if (ticket.isDeleted === true || ticket.isDeleted === "true") return true;
      var rawSt = ticket.status !== undefined ? ticket.status : ticket['Status'];
      if (rawSt && normalizeStatus(rawSt) === "Excluído") return true;
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

    var KNOWN_SHEET_IDS_KEY = "truckpag_sheet_known_ids_v27";
    var hasLoadedFromSheet = false;

    function getKnownSheetIds() {
      try {
        var raw = localStorage.getItem(KNOWN_SHEET_IDS_KEY);
        if (raw) {
          var obj = JSON.parse(raw);
          if (obj && typeof obj === "object") return obj;
        }
      } catch(e) {}
      return {};
    }

    function saveKnownSheetIds(map) {
      try { localStorage.setItem(KNOWN_SHEET_IDS_KEY, JSON.stringify(map)); } catch(e) {}
    }

    function isTicketSyncedWithSheet(sheetTicket, localTicket) {
      if (!sheetTicket || !localTicket) return false;
      return (
        normalizeStatus(sheetTicket.status) === normalizeStatus(localTicket.status) &&
        normalizeProduct(sheetTicket.product) === normalizeProduct(localTicket.product) &&
        String(sheetTicket.solicitacao || "").trim() === String(localTicket.solicitacao || "").trim() &&
        String(sheetTicket.terceiro || "").trim() === String(localTicket.terceiro || "").trim() &&
        String(sheetTicket.client || "").trim() === String(localTicket.client || "").trim() &&
        String(sheetTicket.operator || "").trim() === String(localTicket.operator || "").trim() &&
        String(sheetTicket.description || "").trim() === String(localTicket.description || "").trim() &&
        String(sheetTicket.endDate || "").trim() === String(localTicket.endDate || "").trim()
      );
    }

    function confirmPendingOp(ticketId) {
      if (!ticketId) return;
      var ops = getPendingOps();
      var key = String(ticketId).trim();
      if (ops[key]) {
        ops[key].confirmed = true;
        ops[key].confirmedAt = Date.now();
        ops[key].lastSentAt = Date.now();
        savePendingOps(ops);
      }
    }

    function pruneConfirmedOps(sheetMap) {
      var ops = getPendingOps();
      var now = Date.now();
      var changed = false;
      Object.keys(ops).forEach(function(k) {
        var op = ops[k];
        if (!op) return;
        if (sheetMap) {
          if (op.action === "delete") {
            if (!sheetMap[k] || normalizeStatus(sheetMap[k].status) === "Excluído") {
              delete ops[k];
              changed = true;
              return;
            }
          } else if (op.ticket && isTicketSyncedWithSheet(sheetMap[k], op.ticket)) {
            delete ops[k];
            changed = true;
            return;
          }
          // Se ainda não refletiu na planilha após 8s, marca para reenvio imediato
          if (op.confirmed && (now - (op.lastSentAt || op.confirmedAt || op.timestamp) > 8000)) {
            op.confirmed = false;
            changed = true;
          }
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
      var manutTipo = String(row.manutencaoTipo || row['Tipo Manutenção'] || (prod === "MANUTENÇÃO" && dafRede ? "Estabelecimento" : "")).trim();
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
        manutencaoTipo: manutTipo,
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
      var ops = getPendingOps();
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

      var tid = String(ticketData.id || "").trim();
      var knownIds = getKnownSheetIds();
      var isInitialSeed = typeof INITIAL_ID_SET !== "undefined" && !!INITIAL_ID_SET[tid];

      var cleanPayloadTicket = Object.assign({}, ticketData, {
        id: tid,
        returnDate: formatOnlyDateBR(ticketData.returnDate)
      });

      function postPayload(act, payloadObj) {
        return fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: act,
            id: tid,
            ticket: payloadObj
          })
        }).then(function(res) { return res.text(); });
      }

      // Se for exclusão:
      // 1) Para registros base do config.js (INITIAL_ID_SET), grava tombstone status="Excluído" na planilha
      //    para que todos os 3 operadores saibam que foi excluído e não recarreguem do config.js.
      // 2) Para registros criados dinamicamente, marca status="Excluído" e dispara action="delete".
      if (actionType === "delete") {
        var tombstoneTicket = Object.assign({}, cleanPayloadTicket, {
          status: "Excluído",
          isDeleted: true,
          updatedAt: new Date().toISOString()
        });
        var delPromise;
        if (isInitialSeed) {
          var tombAct = knownIds[tid] ? "update" : "create";
          delPromise = postPayload(tombAct, tombstoneTicket).then(function(rawText) {
            var parsed = null;
            try { parsed = JSON.parse(rawText); } catch(e) {}
            if (parsed && parsed.status === "error" && tombAct === "update") {
              return postPayload("create", tombstoneTicket);
            }
          });
        } else {
          delPromise = postPayload("update", tombstoneTicket)
            .catch(function() {})
            .then(function() { return postPayload("delete", tombstoneTicket); });
        }
        return delPromise
          .then(function() {
            if (isInitialSeed) {
              var k = getKnownSheetIds();
              k[tid] = true;
              saveKnownSheetIds(k);
            }
            confirmPendingOp(tid);
            setSyncBadge('', '↻ ● Sincronizado');
          })
          .catch(function(err) {
            console.warn("Falha temporária na exclusão:", err);
            setSyncBadge('offline', '↻ ● Pendente');
          });
      }

      var effectiveAction = actionType;
      // Se é uma atualização de registro que ainda não está na planilha (ex: REC-RETRO-*, HIST-*), cria na planilha
      if (actionType === "update" && !knownIds[tid] && (hasLoadedFromSheet || isInitialSeed)) {
        effectiveAction = "create";
      }

      return postPayload(effectiveAction, cleanPayloadTicket)
      .then(function(rawText) {
        var parsed = null;
        try { parsed = JSON.parse(rawText); } catch(e) {}
        if (parsed && parsed.status === "error" && effectiveAction === "update") {
          return postPayload("create", cleanPayloadTicket).then(function(retryText) {
            var retryParsed = null;
            try { retryParsed = JSON.parse(retryText); } catch(e) {}
            if (retryParsed && retryParsed.status === "error") {
              throw new Error(retryParsed.message || "Erro ao criar linha na planilha");
            }
          });
        }
        if (parsed && parsed.status === "error") {
          throw new Error(parsed.message || "Erro retornado pela planilha");
        }
      })
      .then(function() {
        if (effectiveAction === "create") {
          var k = getKnownSheetIds();
          k[tid] = true;
          saveKnownSheetIds(k);
        }
        confirmPendingOp(tid);
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

        hasLoadedFromSheet = true;
        var delList = getDeletedIds();
        var delChanged = false;
        if (Array.isArray(resp.deletedIds)) {
          resp.deletedIds.forEach(function(did) {
            var cleanDid = String(did || "").trim();
            if (cleanDid && delList.indexOf(cleanDid) === -1) {
              delList.push(cleanDid);
              delChanged = true;
            }
          });
        }

        var sheetMap = {};
        var knownMap = {};
        if (Array.isArray(resp.data)) {
          resp.data.map(mapSheetRowToTicket).forEach(function(t) {
            if (t.id) {
              knownMap[t.id] = true;
              if (t.status === "Excluído" || isDeletedTicket(t, delList)) {
                if (delList.indexOf(t.id) === -1) {
                  delList.push(t.id);
                  delChanged = true;
                }
              } else {
                sheetMap[t.id] = t;
              }
            }
          });
        }
        if (delChanged) saveDeletedIds(delList);
        saveKnownSheetIds(knownMap);

        // Se existe uma operação pendente não-delete para um ID que ainda não consta na planilha, re-envia como create
        var currentOps = getPendingOps();
        Object.keys(currentOps).forEach(function(opId) {
          var op = currentOps[opId];
          if (op && op.action !== "delete" && op.ticket && !sheetMap[opId] && !isDeletedTicket(op.ticket, delList)) {
            op.confirmed = false;
          }
        });
        savePendingOps(currentOps);

        var activePending = pruneConfirmedOps(sheetMap);
        var localById = {};
        allTickets.forEach(function(lt) {
          if (lt && lt.id) localById[String(lt.id).trim()] = lt;
        });

        var mergedMap = {};

        RAW_INITIAL_RECORDS.forEach(function(r) {
          if (!isDeletedTicket(r, delList)) {
            var copy = Object.assign({}, r);
            copy.returnDate = formatOnlyDateBR(copy.returnDate);
            mergedMap[r.id] = copy;
          }
        });

        Object.keys(sheetMap).forEach(function(id) {
          if (delList.indexOf(id) !== -1) return;
          var sTicket = sheetMap[id];
          var lTicket = localById[id];
          // Proteção contra leitura defasada entre os 3 operadores: se o registro local tem updatedAt mais recente, preserva o local
          if (lTicket && lTicket.updatedAt && sTicket.updatedAt) {
            var lTime = Date.parse(lTicket.updatedAt);
            var sTime = Date.parse(sTicket.updatedAt);
            if (!isNaN(lTime) && !isNaN(sTime) && lTime > sTime + 1500) {
              mergedMap[id] = lTicket;
              return;
            }
          }
          mergedMap[id] = sTicket;
        });

        // Aplica todas as mutações locais pendentes por cima para nunca perder edição/finalização/reversão/exclusão
        Object.keys(activePending).forEach(function(lid) {
          var op = activePending[lid];
          if (op.action === "delete" || delList.indexOf(lid) !== -1) {
            delete mergedMap[lid];
          } else if (op.ticket && !isDeletedTicket(op.ticket, delList)) {
            mergedMap[lid] = op.ticket;
          }
        });

        // Garante remoção absoluta de qualquer ID na lista de excluídos
        delList.forEach(function(did) {
          delete mergedMap[did];
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

    var lastFocusSyncAt = 0;
    function triggerVisibilitySync() {
      var now = Date.now();
      if (now - lastFocusSyncAt < 5000) return;
      lastFocusSyncAt = now;
      var modal = document.getElementById('modalOverlay');
      var editForm = document.getElementById('drawerEditForm');
      var modalOpen = modal && modal.style.display === 'flex';
      var editOpen = editForm && editForm.style.display === 'flex';
      if (!modalOpen && !editOpen) {
        syncFromGoogleSheets(false);
      }
    }

    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) triggerVisibilitySync();
    });
    window.addEventListener('focus', triggerVisibilitySync);

    setInterval(function() {
      var modal = document.getElementById('modalOverlay');
      var editForm = document.getElementById('drawerEditForm');
      var modalOpen = modal && modal.style.display === 'flex';
      var editOpen = editForm && editForm.style.display === 'flex';
      if (!modalOpen && !editOpen) {
        syncFromGoogleSheets(false);
      }
    }, 12000);

    // =========================================================================
