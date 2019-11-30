package com.dynatrace.cordova.plugin;

import java.util.Map;
import java.util.HashMap;
import java.io.IOException;
 
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaWebView;
import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;

import android.content.Context;

import com.dynatrace.android.agent.Dynatrace;
import com.dynatrace.android.agent.DTXAction;
import com.dynatrace.android.agent.DTXActionImpl;
import com.dynatrace.android.agent.conf.Configuration;
import com.dynatrace.android.agent.conf.AgentMode;
import com.dynatrace.android.agent.conf.BuilderUtil;
import com.dynatrace.android.agent.conf.ConfigurationBuilder;
import com.dynatrace.android.agent.conf.DynatraceConfigurationBuilder;
import com.dynatrace.android.agent.conf.AppMonConfigurationBuilder;
import com.dynatrace.android.agent.util.Utility;

public class DynatraceCordovaPlugin extends CordovaPlugin {
	
	public static final String ACTION_UEM_END_SESSION = "endVisit";
	public static final String ACTION_UEM_ENTER_ACTION = "enterAction";
	public static final String ACTION_UEM_LEAVE_ACTION = "leaveAction";

	public HashMap<String, DTXActionImpl> currentActions;

	
	@Override
	public void initialize(CordovaInterface cordova, CordovaWebView webView) {
		super.initialize(cordova, webView);
			Context context = cordova.getActivity().getApplicationContext();
			System.out.println("Dynatrace - context: " + context.toString());
			Configuration configuration = DynatraceCordovaPlugin.loadProperties(context);
			System.out.println("Dynatrace - configuration: " + configuration.toString());

			int status = Dynatrace.startup(context, configuration);
			System.out.println("Dynatrace - status code: " + String.valueOf(status));
			currentActions = new HashMap();

	}

	@Override
	public boolean execute(String method, JSONArray args, CallbackContext callbackContext) throws JSONException {
		try {
			if (method.equals(ACTION_UEM_END_SESSION)) {
				int status = Dynatrace.endVisit();
				callbackContext.success(String.valueOf(status));
				
				return true;
			}
			if (method.equals(ACTION_UEM_ENTER_ACTION)) {
				DTXActionImpl action = (DTXActionImpl) Dynatrace.enterAction(args.getJSONObject(0).getString("name"));
				String actionId = action.getName() + "_" + String.valueOf(action.getTagId());

				JSONObject returnMessage = new JSONObject();
				returnMessage.put("ActionID", actionId);
				currentActions.put(actionId, action);

				callbackContext.success(returnMessage);
				return true;
			}
			if (method.equals(ACTION_UEM_LEAVE_ACTION)) {
				DTXActionImpl action = currentActions.get(args.getJSONObject(0).getString("name"));
				if (action != null) {
					int code = action.leaveAction();
					JSONObject returnMessage = new JSONObject();
					returnMessage.put("Code", String.valueOf(code));
					Dynatrace.endVisit();
					callbackContext.success(code);
				}
				
				return true;
			}

			//  public static DTXAction enterAction(String actionName)
			
			return false;
		} catch(Exception e) {
			System.err.println("Exception: " + e.getMessage());
			callbackContext.error(e.getMessage());
			return false;
		} 
	}

	public static Configuration loadProperties(Context context)
  {
	  Map<String, String> properties;
	  ConfigurationBuilder builder;
	   try
    {
     properties = Utility.loadRuntimeProperties(context.getAssets().open("www/Dynatrace.properties"));
    }
    catch (IOException e) {
		properties = new HashMap();
	}

	String applicationId = (String)properties.get("DTXApplicationID");
	String beaconUrl = (String)properties.get("DTXBeaconURL");

	if (beaconUrl != null)
	{
	builder = new DynatraceConfigurationBuilder(applicationId, beaconUrl);
	}
	else
	{
	String environment = (String)properties.get("DTXAgentEnvironment");
	if (environment != null)
	{
		String isManagedCluster = (String)properties.get("DTXManagedCluster");
		String clusterUrl = (String)properties.get("DTXClusterURL");
		
		builder = new DynatraceConfigurationBuilder(applicationId, environment, clusterUrl, Boolean.parseBoolean(isManagedCluster));
	}
	 else
        {
          String appMonStartupPath = (String)properties.get("DTXAgentStartupPath");
          builder = new AppMonConfigurationBuilder(applicationId, appMonStartupPath);
        }
	}
    
    return builder.loadProperties(context, properties).buildConfiguration();
  }

}