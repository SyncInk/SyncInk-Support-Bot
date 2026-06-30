with open('cogs/security.py', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's fix the verify_button block
bad_block1 = """                    if custom_msg:
                        desc = custom_msg.replace("{user}", interaction.user.mention).replace("{server}", interaction.guild.name)
                    else:
                        desc = (
                            f"Welcome to the {interaction.guild.name}, {interaction.user.mention}!\\n\\n"
                            "We are thrilled to have you here. To get started, please check out our core channels:\\n"
                            "📢 **Announcements** - Stay updated with our latest news.\\n"
                            "💬 **Support Chat** - Get help from our dedicated team.\\n"
                            "💡 **Feature Requests** - Share your ideas for the platform.\\n"
                            "📦 **Products** - Explore what we have to offer."
                        )"""

good_block1 = """                    if custom_msg:
                        desc = custom_msg.replace("{user}", interaction.user.mention).replace("{server}", interaction.guild.name)
                    else:
                        desc = (
                            f"Welcome to the {interaction.guild.name}, {interaction.user.mention}!\\n\\n"
                            "We are thrilled to have you here. To get started, please check out our core channels:\\n"
                            "📢 **Announcements** - Stay updated with our latest news.\\n"
                            "💬 **Support Chat** - Get help from our dedicated team.\\n"
                            "💡 **Feature Requests** - Share your ideas for the platform.\\n"
                            "📦 **Products** - Explore what we have to offer."
                        )"""

# I need to find the exact text in the file. Since there's an indentation error, I'll use regex or string replace.
import re

text = re.sub(
    r'if custom_msg:\s+desc = custom_msg\.replace\("{user}", interaction\.user\.mention\)\.replace\("{server}", interaction\.guild\.name\)\s+else:\s+desc = \(',
    r'if custom_msg:\n                        desc = custom_msg.replace("{user}", interaction.user.mention).replace("{server}", interaction.guild.name)\n                    else:\n                        desc = (',
    text
)

# And fix on_member_join block if it's broken too
text = re.sub(
    r'if custom_msg:\s+desc = custom_msg\.replace\("{user}", member\.mention\)\.replace\("{server}", member\.guild\.name\)\s+desc = \(',
    r'if custom_msg:\n                        desc = custom_msg.replace("{user}", member.mention).replace("{server}", member.guild.name)\n                    else:\n                        desc = (',
    text
)

with open('cogs/security.py', 'w', encoding='utf-8') as f:
    f.write(text)
print('Fixed.')
