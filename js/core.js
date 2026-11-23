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

    function normTextVal(v) {
      return String(v === null || v === undefined ? "" : v).replace(/\r\n/g, "\n").trim();
    }

    function isTicketSyncedWithSheet(sheetTicket, localTicket) {
      if (!sheetTicket || !localTicket) return false;
      return (
        normalizeStatus(sheetTicket.status) === normalizeStatus(localTicket.status) &&
        normalizeProduct(sheetTicket.product) === normalizeProduct(localTicket.product) &&
        normTextVal(sheetTicket.solicitacao) === normTextVal(localTicket.solicitacao) &&
        normTextVal(sheetTicket.terceiro) === normTextVal(localTicket.terceiro) &&
        normTextVal(sheetTicket.client) === normTextVal(localTicket.client) &&
        normTextVal(sheetTicket.operator) === normTextVal(localTicket.operator) &&
        normTextVal(sheetTicket.contact) === normTextVal(localTicket.contact) &&
        formatOnlyDateBR(sheetTicket.returnDate) === formatOnlyDateBR(localTicket.returnDate) &&
        normTextVal(sheetTicket.bitrixLink) === normTextVal(localTicket.bitrixLink) &&
        normTextVal(sheetTicket.manutencaoTipo) === normTextVal(localTicket.manutencaoTipo) &&
        normTextVal(sheetTicket.dafRede) === normTextVal(localTicket.dafRede) &&
        normTextVal(sheetTicket.dafMunicipio) === normTextVal(localTicket.dafMunicipio) &&
        normTextVal(sheetTicket.description) === normTextVal(localTicket.description) &&
        normTextVal(sheetTicket.endDate) === normTextVal(localTicket.endDate)
      );
    }

    function countPopulatedFields(t) {
      if (!t) return 0;
      var score = 0;
      if (t.description) score += 2 + Math.min(5, Math.floor(String(t.description).length / 20));
      if (t.bitrixLink) score += 2;
      if (t.contact) score += 1;
      if (t.returnDate && t.returnDate !== 'A definir') score += 1;
      if (t.dafRede) score += 1;
      if (t.dafMunicipio) score += 1;
      if (t.manutencaoTipo) score += 1;
      if (t.endDate) score += 2;
      return score;
    }

    function pickBestSheetTicket(existing, candidate) {
      if (!existing) return candidate;
      if (!candidate) return existing;
      var eTime = existing.updatedAt ? Date.parse(existing.updatedAt) : NaN;
      var cTime = candidate.updatedAt ? Date.parse(candidate.updatedAt) : NaN;
      if (!isNaN(eTime) && !isNaN(cTime) && eTime !== cTime) {
        return cTime > eTime ? candidate : existing;
      }
      if (!isNaN(cTime) && isNaN(eTime)) return candidate;
      if (!isNaN(eTime) && isNaN(cTime)) return existing;
      return countPopulatedFields(candidate) >= countPopulatedFields(existing) ? candidate : existing;
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

    function pruneConfirmedOps(sheetMap, delList) {
      var ops = getPendingOps();
      var now = Date.now();
      var changed = false;
      var deletedSet = delList || getDeletedIds();
      Object.keys(ops).forEach(function(k) {
        var op = ops[k];
        if (!op) return;
        if (sheetMap) {
          if (op.action === "delete") {
            // Só considera exclusão concluída quando a planilha confirmar o tombstone (status Excluído)
            if (deletedSet.indexOf(k) !== -1 && !sheetMap[k]) {
              delete ops[k];
              changed = true;
              return;
            }
          } else if (op.ticket && isTicketSyncedWithSheet(sheetMap[k], op.ticket)) {
            delete ops[k];
            changed = true;
            return;
          }
          // Se ainda não refletiu na planilha após 6s, marca para reenvio imediato
          if (op.confirmed && (now - (op.lastSentAt || op.confirmedAt || op.timestamp) > 6000)) {
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
    var inFlightMutations = {};

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
      var ids = Object.keys(ops);
      if (ids.length === 0) return Promise.resolve();

      var promises = ids.map(function(id) {
        if (inFlightMutations[id]) {
          return inFlightMutations[id];
        }
        var op = ops[id];
        if (!op.confirmed) {
          return sendMutationToSheet(op.action, op.ticket, true);
        }
        return Promise.resolve();
      });
      return Promise.all(promises);
    }

    function sendMutationToSheet(actionType, ticketData, isRetry) {
      var tid = String(ticketData.id || "").trim();
      if (!isRetry) {
        registerPendingOp(actionType, ticketData);
      }
      setSyncBadge('syncing', '⏳ Salvando...');

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

      var reqPromise;

      // Exclusão permanente compartilhada entre os 3 operadores:
      // Grava status="Excluído" e isDeleted=true na planilha (sem apagar o tombstone),
      // garantindo que Mirian, Leandro e Isabelli recebam o bloqueio automaticamente ao carregar/sincronizar.
      if (actionType === "delete") {
        var tombstoneTicket = Object.assign({}, cleanPayloadTicket, {
          status: "Excluído",
          isDeleted: true,
          updatedAt: new Date().toISOString()
        });
        var tombAct = (knownIds[tid] || !hasLoadedFromSheet) ? "update" : "create";
        reqPromise = postPayload(tombAct, tombstoneTicket)
          .then(function(rawText) {
            var parsed = null;
            try { parsed = JSON.parse(rawText); } catch(e) {}
            if (parsed && parsed.status === "error" && tombAct === "update") {
              return postPayload("create", tombstoneTicket);
            }
          })
          .then(function() {
            var k = getKnownSheetIds();
            k[tid] = true;
            saveKnownSheetIds(k);
            confirmPendingOp(tid);
            setSyncBadge('', '↻ ● Sincronizado');
            if (!isRetry) {
              setTimeout(function() { syncFromGoogleSheets(false); }, 1500);
            }
          })
          .catch(function(err) {
            console.warn("Falha temporária na exclusão:", err);
            setSyncBadge('offline', '↻ ● Pendente');
          });
      } else {
        var effectiveAction = actionType;
        if (actionType === "update" && !knownIds[tid] && (hasLoadedFromSheet || isInitialSeed)) {
          effectiveAction = "create";
        }

        reqPromise = postPayload(effectiveAction, cleanPayloadTicket)
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
          if (!isRetry) {
            setTimeout(function() { syncFromGoogleSheets(false); }, 1500);
          }
        })
        .catch(function(err) {
          console.warn("Falha temporária no envio:", err);
          setSyncBadge('offline', '↻ ● Pendente');
        });
      }

      if (tid) {
        inFlightMutations[tid] = reqPromise.finally(function() {
          delete inFlightMutations[tid];
        });
        return inFlightMutations[tid];
      }
      return reqPromise;
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
        var activeDuplicateOfDeleted = [];
        if (Array.isArray(resp.data)) {
          var mappedRows = resp.data.map(mapSheetRowToTicket);
          // 1ª passagem: identifica todos os IDs conhecidos e todos os tombstones ("Excluído") na planilha
          mappedRows.forEach(function(t) {
            if (!t.id) return;
            knownMap[t.id] = true;
            if (t.status === "Excluído" || isDeletedTicket(t, delList)) {
              if (delList.indexOf(t.id) === -1) {
                delList.push(t.id);
                delChanged = true;
              }
            }
          });
          // 2ª passagem: consolida linhas ativas usando pickBestSheetTicket para nunca deixar duplicata antiga sobrescrever edição recente
          mappedRows.forEach(function(t) {
            if (!t.id) return;
            if (delList.indexOf(t.id) !== -1 || isDeletedTicket(t, delList)) {
              if (t.status !== "Excluído" && activeDuplicateOfDeleted.indexOf(t.id) === -1) {
                activeDuplicateOfDeleted.push(t.id);
              }
              return;
            }
            sheetMap[t.id] = pickBestSheetTicket(sheetMap[t.id], t);
          });
        }
        if (delChanged) saveDeletedIds(delList);
        saveKnownSheetIds(knownMap);

        // Se havia linha duplicada ativa de um ID já excluído, propaga status="Excluído" para limpar a duplicata na planilha
        activeDuplicateOfDeleted.forEach(function(dupId) {
          if (!inFlightMutations[dupId]) {
            sendMutationToSheet("delete", { id: dupId, status: "Excluído", isDeleted: true }, true);
          }
        });

        // Se existe uma operação pendente não-delete para um ID que ainda não consta na planilha, re-envia como create
        var currentOps = getPendingOps();
        Object.keys(currentOps).forEach(function(opId) {
          var op = currentOps[opId];
          if (op && op.action !== "delete" && op.ticket && !sheetMap[opId] && !isDeletedTicket(op.ticket, delList)) {
            op.confirmed = false;
          }
        });
        savePendingOps(currentOps);

        var activePending = pruneConfirmedOps(sheetMap, delList);
        var mergedMap = {};

        RAW_INITIAL_RECORDS.forEach(function(r) {
          if (!isDeletedTicket(r, delList)) {
            var copy = Object.assign({}, r);
            copy.returnDate = formatOnlyDateBR(copy.returnDate);
            mergedMap[r.id] = copy;
          }
        });

        // A planilha é a fonte oficial compartilhada entre os 3 operadores
        Object.keys(sheetMap).forEach(function(id) {
          if (delList.indexOf(id) !== -1) return;
          mergedMap[id] = sheetMap[id];
        });

        // Aplica apenas as mutações locais ainda não confirmadas na planilha
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
              var changedWhileOpen = !isTicketSyncedWithSheet(refreshed, activeSelectedTicket);
              openDrawer(refreshed, true);
              if (changedWhileOpen) {
                showToast("Card atualizado com alterações recentes da equipe!");
              }
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
      if (now - lastFocusSyncAt < 3000) return;
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
    }, 8000);

    // =========================================================================
