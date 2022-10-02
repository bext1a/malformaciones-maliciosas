Hooks.once('init', function() {
  game.settings.register("mmm", "applyOnCritSave", {
    name: "Por pífia en Tirada de Salvación",
    hint: "Solicitar una tirada de lesión permanente por pífia en tirada de salvación.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register("mmm", "applyOnCrit", {
    name: "Por crítico",
    hint: "Solicitar una tirada de lesión permanente por daño crítico.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register("mmm", "applyOnDamage", {
    name: "On Damage",
    hint: "Solicitar una tirada de lesión permanente si recibe más daño que la mitad de su vida máxima.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register("mmm", "applyOnDown", {
    name: "Por inconsciencia",
    hint: "Solicitar una tirada de lesión permanente si el daño del personaje cae a 0 PG.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register("mmm", "nonMidiAutomation", {
    name: "Habilitar la automatización sin non-midiqol",
    hint: "Habilita cierta automatización para los casos en que no se esté usando midiqol o esté eliminando vida manualmente. Las únicas automatizaciones que funcionan son 'Por inconsciencia' y 'Por daño'. Ésto es debido a que el sistema no sabe qué tipo de daño desencadenó la lesión, se le pedirá al jugador que elija.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register("mmm", "triggerNpc", {
    name: "Activar lesiones en PNJs",
    hint: "Habilita la automatización también para los PNJs.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register("mmm", "selfdestruct", {
    name: "Destruir objetos",
    hint: "Cuando los efectos activos acaban, destruye el objeto que ha sido dañado. (requiere DAE/MidiQoL)",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

});

Hooks.once('ready', async function() {

});

Hooks.on("chatMessage", (ChatLog, content) => {
    if (content.toLowerCase().startsWith("/mmmm")) {
      const data = content.replace("/mmmm", "").trim();
      if(data){
        ManualMorton.rollTable(data);
      }else{
        ManualMorton.displayDialog();
      }

      return false;
    }
  });

Hooks.on("renderChatMessage", (message, html)=>{
    if(!game.user.isGM || !message?.flavor?.includes("[MMMM]")) return;
    const subTables = ["Cicatrices", "Pequeños Apéndices", "Grandes Extremidades"];
    for(let t of subTables){
      if(message?.flavor?.includes(t)) return;
    }
    const button = $(`<a title="Aplica la Lesión Permanente" style="margin-right: 0.3rem;color: red;" class="button"><i class="fas fa-viruses"></i></a>`)
    html.find(".result-text").prepend(button)
    button.on("click", async (e)=>{
        e.preventDefault();
        let actor = game.scenes.get(message?.speaker?.scene)?.tokens?.get(message?.speaker?.token)?.actor;
        actor = actor ?? (game.actors.get(message?.speaker?.actor) ?? _token?.actor);
        if(!actor) return ui.notifications.error("¡O no has seleccionado la ficha o no se encuentra el personaje!");
        const content = $(message.content)
        const imgsrc = content.find("img").attr("src");
        const description = content.find(".result-text").html();
        const duration = ManualMorton.inferDuration(content.find(".result-text").text());
        const title = "Lingering Injury - " + content.find("strong").first().text();
        const itemData = {
            name: title,
            img: imgsrc,
            type: "feat",
            "system.description.value": description,
            flags: {
              mmm: 
              {
                lingeringInjury: true
              }
            },
            "effects": [
              {
                icon: imgsrc,
                label: title,
                transfer: true,
                changes: [
                  {
                    "key": "flags.dae.deleteOrigin",
                    "value":  game.settings.get("mmm", "selfdestruct") ? 1 : "",
                    "mode": 2,
                    "priority": 0
                  }
                ],
                duration: {
                  seconds: title.includes("(") ? null : duration || 9999999999,
                },
                flags: {
                  mmm: 
                  {
                    lingeringInjury: true
                  },
                },
              }
            ],
        }
        actor.createEmbeddedDocuments("Item", [itemData]);
        ui.notifications.notify(`Añadida ${title} a ${actor.name}`)
    });
});

let MaxwelMaliciousMaladiesSocket;

Hooks.once("socketlib.ready", () => {
  MaxwelMaliciousMaladiesSocket = socketlib.registerModule("mmm");
  MaxwelMaliciousMaladiesSocket.register("requestRoll", ManualMorton.requestRoll);
});