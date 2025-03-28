var _log_tag = "send_notification_assign_tutor";
EnableLog(_log_tag);

function Log(message)
{
    LogEvent(_log_tag, message)
}


try
{
    var _col_id = Param.GetOptProperty("collaborator", null);
    var _manager_id = Param.GetOptProperty("manager", null);

    var _adaptation = ArrayOptFirstElem(XQuery("for $elem in career_reserves where person_id="+ _col_id +" return $elem"), null);

    if (_adaptation != null)
    {
        _message = "<p>Добрый день, у вас в подчинении появился новый сотрудник ("+String(_adaptation.person_fullname)+"), который должен пройти адаптацию,<p>";
        _message += "<p>пожалуйста перейдите в течение рабочего дня по <a href='https://exam.askona.ru/_wt/set_tutor_for_adaptation?career_reserve_id=" + Int(_adaptation.id) + "'>ссылке</a> и укажите, кто будет его куратором.<p>"

        _created = tools.create_notification("notice_for_manager_set_tutor", _manager_id, _message);
    }
    }
catch (err)
{
    Log(String(err))
}