"""Config flow for Hello World integration."""
import logging

import voluptuous as vol

from homeassistant import config_entries

from .const import DOMAIN  # pylint:disable=unused-import

_LOGGER = logging.getLogger(__name__)

DATA_SCHEMA = vol.Schema({
    vol.Optional("access_key", default = ""): str,
    vol.Optional("secret_key", default = ""): str,
    vol.Optional("bucket_name", default = ""): str,
    vol.Optional("prefix", default = ""): str,
    vol.Optional("download", default = ""): str
})

class ConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):

    VERSION = 1
    CONNECTION_CLASS = config_entries.CONN_CLASS_CLOUD_POLL

    async def async_step_user(self, user_input=None):        
        errors = {}
        if DOMAIN in self.hass.data:
            return self.async_abort(reason="single_instance_allowed")

        # 如果输入内容不为空，则进行验证
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)
        
        # 显示表单
        return self.async_show_form(
            step_id="user", data_schema=DATA_SCHEMA, errors=errors
        )