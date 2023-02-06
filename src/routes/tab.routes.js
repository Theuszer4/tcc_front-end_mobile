import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Chamados from "../pages/Chamados";
import Perfil from "../pages/Perfil";
import NavigationButton from "../components/NavigationButton";

const { Screen, Navigator } = createBottomTabNavigator();

export default function TabRoutes() {
  return (
    <Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: "flex",
          alignItems: "center",
          height: 60,
        },
      }}
    >
      <Screen
        name="Chamados"
        component={Chamados}
        options={{
          tabBarButton: (props) => {
            return (
              <NavigationButton
                {...props}
                name="clipboard-list-outline"
                pageName="Chamados"
              />
            );
          },
        }}
      />
      <Screen
        name="Perfil"
        component={Perfil}
        options={{
          tabBarButton: (props) => {
            return (
              <NavigationButton {...props} name="account" pageName="Perfil" />
            );
          },
        }}
      />
    </Navigator>
  );
}