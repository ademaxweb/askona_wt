var _log_tag = "adaptation_assign_tutor"
EnableLog(_log_tag);


function using(lib) {
    path = "x-app://custom_libs/";

    DropFormsCache(path + lib + ".js");
    return OpenCodeLib(path + lib + ".js"); 
}

function Log(message) {
    LogEvent(_log_tag, message);
}

try
{   
    Log("");
    Log("Агент начинает свою работу");
    var date_lib = using("date_lib");


    _groups =  tools_web.parse_multiple_parameter(Param.groups);
    for(_group in _groups) {

        _teGroup = tools.open_doc(_group).TopElem;
        _colls = _teGroup.collaborators;

        _teTypicalDevProgram = tools.open_doc(_teGroup.typical_development_programs[0].typical_development_program_id).TopElem;
        _welcomeMessageId = _teTypicalDevProgram.custom_elems.ObtainChildByKey("welcome_message").value;
        _message = tools.open_doc(_welcomeMessageId).TopElem.body;

        _newCollsCR = ArraySelectAll( XQuery("for $elem in career_reserves where MatchSome($elem/person_id, (" + ArrayMerge(_colls, "XQueryLiteral(This.collaborator_id)", ",") + ")) and $elem/start_date >= date('"+StrDate( DateOffset(Date(), -86400) , false)+"') return $elem") );
        
        Log("Найдено новых адаптаций в группе " + _group + " (" + _teGroup.name + "): " + ArrayCount(_newCollsCR) );

        if (ArrayCount(_newCollsCR) < 1) continue;

        _hrId = ArrayOptFind( _teGroup.func_managers, "This.boss_type_id == 6480743795977451455" );

        if(_hrId == undefined) {
            continue;
        } else {
            _hrId = _hrId.person_id;
        }

        Log("HR менеджер для группы: " + _hrId);
        
        for(_newCollCR in _newCollsCR) {
            Log("Обработка адаптации #" + _newCollCR.id);
            try {
                _careerReserve = tools.open_doc(_newCollCR.id);
                _teColl = tools.open_doc(_newCollCR.person_id).TopElem;
                _managerId = undefined;

                _manager = ArrayOptFind(_teColl.func_managers, "This.boss_type_id == 6875311715516440177");

                if(_manager != undefined) {
                    _managerId = _manager.person_id;
                } else {
                    _manager = ArrayOptFind(_teColl.func_managers, "This.boss_type_id == 6148914691236517290");

                    if(_manager != undefined) {
                        _managerId = _manager.person_id;
                    }
                }


                _teManager = undefined;
                if(_managerId != undefined) {
                    _teManager = tools.open_doc(_managerId).TopElem;
                }
                Log("Руководитель для сотрудника " + _teColl.id + ": #" + _managerId + "(" + (_teManager != undefined ? _teManager.lastname : "-") + ")");


                if(date_lib.datesEqual( Date(), Date(_careerReserve.TopElem.start_date), false )) {
                    Log("Сегодня день начала адаптации");
                    if(_managerId != undefined) {

                        if( ArrayCount(_careerReserve.TopElem.tutors) == 0 ) {

                            _message = "<p>Добрый день, у вас в подчинении появился новый сотрудник ("+_teColl.fullname+"), который должен пройти адаптацию,<p>";
                            _message += "<p>пожалуйста перейдите в течение рабочего дня по <a href='https://exam.askona.ru/_wt/set_tutor_for_adaptation?career_reserve_id="+_newCollCR.id+"'>ссылке</a> и укажите, кто будет его куратором.<p>"

                            //_created = tools.create_notification("notice_for_manager_set_tutor", _managerId, _message);
                            _created = false;

                            if(_created) {
        
                                Log("Создано уведомление по прикреплению куратора к адаптации для " + _newCollCR.person_fullname + " ("+_careerReserve.TopElem.person_id+")");
                            }
                        }
                    }

                } else if(date_lib.datesEqual( Date(), DateOffset(Date(_careerReserve.TopElem.start_date), 86400), false )) {
                    Log("Сегодня второй день начала адаптации");

                    if( ArrayCount(_careerReserve.TopElem.tutors) == 0 ) {
                        Log("Куратор еще не назначен");
                        if(_hrId != undefined) {

                            _managerFullname = _teManager != undefined ? _teManager.fullname : "-";
                            _message = "<p>Добрый день, для сотрудника "+_teColl.fullname+", который должен пройти адаптацию,<p>";
                            _message += "<p>пока не указали куратора. Руководитель: "+_managerFullname+".<p>"
                            _message += "<p>адаптация сотрудника доступна для просмотра по <a href='https://exam.askona.ru/_wt/adaptation_plan?career_reserve_id="+_careerReserve.TopElem.id+"' target='_blank'>ссылке</a><p>"

                            // _created = tools.create_notification("notice_for_manager_set_tutor", _hrId, _message);
                            _created = false;

                            if(_created) {
        
                                Log("Создано уведомление для HR по прикреплению куратора к адаптации для " + _newCollCR.person_fullname + " ("+_careerReserve.TopElem.person_id+")");
                            }
                        }


                    } else {
                        Log("Куратор уже назначен")
                        if(_hrId != undefined) {

                            _managerFullname = _teManager != undefined ? _teManager.fullname : "-";
                            _message = "<p>Добрый день, для сотрудника "+_teColl.fullname+", который должен пройти адаптацию,<p>";
                            _message += "<p>указали куратора. Руководитель: "+_managerFullname+".<p>"
                            _message += "<p>адаптация сотрудника доступна для просмотра по <a href='https://exam.askona.ru/_wt/adaptation_plan?career_reserve_id="+_careerReserve.TopElem.id+"' target='_blank'>ссылке</a><p>"

                            //_created = tools.create_notification("notice_for_manager_set_tutor", _hrId, _message);
                            _created = false;

                            if(_created) {
                                Log("Создано уведомление для HR по прикреплению куратора к адаптации для " + _newCollCR.person_fullname + " ("+_careerReserve.TopElem.person_id+")");
                            }
                        }
                    }
                }
            } catch(e) {
                Log(e);
            }
        }
    }
}
catch (err)
{
    Log(String(err));
}